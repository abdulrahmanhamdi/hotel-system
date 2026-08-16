import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom Metrics
const errorRate = new Rate('custom_error_rate');
const availabilityDuration = new Trend('room_availability_duration');
const bookingDuration = new Trend('create_booking_duration');
const checkInDuration = new Trend('checkin_duration');
const revenueReportDuration = new Trend('revenue_report_duration');

export const options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp up to normal traffic
        { duration: '1m', target: 200 },  // Peak traffic
        { duration: '1m', target: 500 },  // Stress load test
        { duration: '30s', target: 0 },   // Cool down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],        // 95% of all requests must complete within 500ms
        'room_availability_duration': ['p(95)<200'], // Availability queries must be < 200ms
        'create_booking_duration': ['p(95)<500'],    // Booking transactions must be < 500ms
        'custom_error_rate': ['rate<0.01'],          // Total error rate must remain under 1%
    },
};

const API_BASE = __ENV.API_BASE || 'http://localhost:8080/api/v1';

export function setup() {
    // Authenticate and obtain JWT token for virtual users
    const loginPayload = JSON.stringify({
        email: 'admin@hotel.com',
        password: 'Admin@123456',
    });
    const headers = { 'Content-Type': 'application/json' };
    const res = http.post(`${API_BASE}/auth/login`, loginPayload, { headers });
    
    if (res.status === 200) {
        const body = JSON.parse(res.body);
        return { token: body.data.token };
    }
    return { token: '' };
}

export default function (data) {
    const headers = {
        'Authorization': `Bearer ${data.token}`,
        'Content-Type': 'application/json',
    };

    // Scenario 1: High-frequency Room Availability Search (60% weight)
    group('Room Availability Queries', function () {
        const checkIn = '2026-09-01';
        const checkOut = '2026-09-05';
        const res = http.get(`${API_BASE}/rooms/available?check_in=${checkIn}&check_out=${checkOut}`, { headers });
        
        const ok = check(res, {
            'availability status is 200': (r) => r.status === 200,
            'availability latency < 200ms': (r) => r.timings.duration < 200,
        });
        
        availabilityDuration.add(res.timings.duration);
        errorRate.add(!ok);
    });

    sleep(1);

    // Scenario 2: Create Booking & Transaction Processing (20% weight)
    group('Booking Creation', function () {
        const payload = JSON.stringify({
            guest_id: 1,
            room_id: 2,
            check_in_date: '2026-11-01',
            check_out_date: '2026-11-05',
            special_requests: 'k6 load test reservation',
            initial_payment: {
                amount: 150.00,
                payment_method: 'credit_card',
            },
        });

        const res = http.post(`${API_BASE}/bookings`, payload, { headers });
        const ok = check(res, {
            'booking status is 201 or 409 (conflict)': (r) => r.status === 201 || r.status === 409,
            'booking latency < 500ms': (r) => r.timings.duration < 500,
        });

        bookingDuration.add(res.timings.duration);
        errorRate.add(!ok);
    });

    sleep(1);

    // Scenario 3: Check-in / Operations (10% weight)
    group('Front Desk Operations', function () {
        const res = http.get(`${API_BASE}/rooms`, { headers });
        const ok = check(res, {
            'rooms list status is 200': (r) => r.status === 200,
        });
        errorRate.add(!ok);
    });

    sleep(2);

    // Scenario 4: Analytics & Financial Reporting (10% weight)
    group('Revenue Analytics', function () {
        const res = http.get(`${API_BASE}/reports/revenue?from=2026-01-01&to=2026-12-31`, { headers });
        const ok = check(res, {
            'revenue report status is 200': (r) => r.status === 200,
            'revenue latency < 2000ms': (r) => r.timings.duration < 2000,
        });
        revenueReportDuration.add(res.timings.duration);
        errorRate.add(!ok);
    });

    sleep(2);
}
