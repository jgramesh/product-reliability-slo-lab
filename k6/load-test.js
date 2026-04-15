// k6 Load Test for SLO Validation
// Run: k6 run k6/load-test.js
// This script generates traffic to test SLI/SLO compliance
// Reference: https://k6.io/docs/

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for SLO tracking
const errorRate = new Rate('http_errors');
const latency = new Trend('http_latency_ms');
const successRate = new Rate('http_success');

// Target endpoint (update this to your test API)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 VUs
    { duration: '3m', target: 10 },   // Stay at 10 VUs for 3 min
    { duration: '1m', target: 50 },   // Ramp up to 50 VUs (stress test)
    { duration: '2m', target: 50 },   // Stay at 50 VUs for 2 min
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    // SLO thresholds - these should match your SLO targets
    'http_success': ['rate>0.999'],   // 99.9% success rate
    'http_errors':  ['rate<0.001'],   // <0.1% error rate
    'http_latency_ms': ['p(95)<500'], // p95 latency < 500ms
  },
};

export default function () {
  // Simulate normal traffic
  const res = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'health_check' },
  });

  latency.add(res.timings.duration);
  successRate.add(res.status >= 200 && res.status < 400);
  errorRate.add(res.status >= 500);

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Simulate API request
  const apiRes = http.get(`${BASE_URL}/api/data`, {
    tags: { name: 'api_data' },
  });

  latency.add(apiRes.timings.duration);
  successRate.add(apiRes.status >= 200 && apiRes.status < 400);
  errorRate.add(apiRes.status >= 500);

  check(apiRes, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.5);
}

export function handleSummary(data) {
  // Generate summary for SLO reporting
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options || {};
  const color = enableColors ? (c, s) => `\x1b[${c}m${s}\x1b[0m` : (_, s) => s;

  let output = '\n=== SLO Load Test Summary ===\n\n';
  output += indent + `Iterations: ${data.metrics.iterations.values.count}\n`;
  output += indent + `Duration: ${(data.metrics.http_req_duration.values.avg / 1000).toFixed(2)}s avg\n`;
  output += indent + `Success Rate: ${(data.metrics.http_success.values.rate * 100).toFixed(2)}%\n`;
  output += indent + `Error Rate: ${(data.metrics.http_errors.values.rate * 100).toFixed(4)}%\n`;
  output += indent + `P95 Latency: ${data.metrics.http_latency_ms.values['p(95)'].toFixed(2)}ms\n`;
  output += indent + `P99 Latency: ${data.metrics.http_latency_ms.values['p(99)'].toFixed(2)}ms\n`;
  output += indent + `Requests/sec: ${(data.metrics.http_reqs.values.rate).toFixed(2)}\n`;

  // Check SLO compliance
  const sloCompliant = data.metrics.http_success.values.rate >= 0.999;
  const latencyCompliant = data.metrics.http_latency_ms.values['p(95)'] < 500;

  output += '\n--- SLO Compliance ---\n';
  output += indent + `Availability SLO (99.9%): ${sloCompliant ? color(32, 'PASS') : color(31, 'FAIL')}\n`;
  output += indent + `Latency SLO (p95 < 500ms): ${latencyCompliant ? color(32, 'PASS') : color(31, 'FAIL')}\n`;

  return output;
}
