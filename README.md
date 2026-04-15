# Product Reliability SLO Lab

## Overview
Own SLIs/SLOs and monitoring for assigned products/platforms. This lab demonstrates implementing observability tools and dashboards for proactive performance management using Prometheus, Grafana, Sloth, Alertmanager, and k6.

## Architecture

```
+------------------+     +------------------+     +------------------+
|   Application    | --> |    Prometheus    | --> |     Grafana      |
|   (k6 traffic)   |     |   (Metrics + SLO)|     |   (Dashboards)   |
+------------------+     +------------------+     +------------------+
                                |
                                v
                         +------------------+
                         |    Alertmanager  |
                         |  (Burn-rate alerts)| 
                         +------------------+
                                |
                                v
                         +------------------+
                         |   Sloth (SLO     |
                         |   spec manager)  |
                         +------------------+
```

## SLIs (Service Level Indicators)

| SLI | Definition | Target |
|-----|-----------|--------|
| Availability | Percentage of successful HTTP requests (2xx/3xx) | 99.9% |
| Latency | 95th percentile response time | < 500ms |
| Error Rate | Percentage of 5xx server errors | < 0.1% |

## SLOs (Service Level Objectives)

| SLO | Description | Target |
|-----|-------------|--------|
| Availability SLO | 99.9% of requests should return 2xx/3xx over 30 days | 99.9% |
| Latency SLO | 95% of requests should complete under 500ms over 30 days | p95 < 500ms |
| Error Budget | Allow 0.1% error rate per month | 0.1% |

## Error Budget

- Monthly error budget = 0.1% (for 99.9% SLO)
- Alert threshold: Burn rate > 14.4x triggers page
- Burn rate > 6x triggers ticket
- Burn rate > 3x triggers warning

## Components

| Component | Purpose |
|-----------|--------|
| Prometheus | Metrics collection, storage, and SLO recording rules |
| Grafana | SLI/SLO dashboards, error budget visualization |
| Sloth | SLO specification and Prometheus rule generation |
| Alertmanager | Burn-rate alerting with multi-window detection |
| k6 | Load generation and SLO validation testing |
| Kubernetes | Container orchestration for all components |

## Folder Structure

```
product-reliability-slo-lab/
├── README.md
├── prometheus/
│   ├── prometheus.yml
│   ├── slo-rules.yml
│   └── alert-rules.yml
├── grafana/
│   ├── sli-slo-dashboard.json
│   └── error-budget-dashboard.json
├── slo/
│   ├── availability-slo.yml
│   └── latency-slo.yml
├── k6/
│   └── load-test.js
├── k8s/
│   ├── namespace.yaml
│   ├── prometheus-deployment.yaml
│   ├── grafana-deployment.yaml
│   └── alertmanager-deployment.yaml
└── doc/
    └── architecture.png
```

## How to Run

### Prerequisites
- Docker and Docker Compose
- kubectl and kind (Kubernetes in Docker)
- Helm 3.x

### Quick Start with kind

```bash
# Create a local Kubernetes cluster
kind create cluster --name slo-lab

# Install Prometheus Stack via Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace

# Apply custom SLO recording rules
kubectl apply -f prometheus/slo-rules.yml -n monitoring

# Apply alert rules
kubectl apply -f prometheus/alert-rules.yml -n monitoring

# Import Grafana dashboards
kubectl apply -f grafana/sli-slo-dashboard.json -n monitoring

# Run load test with k6
k6 run k6/load-test.js
```

### Verify SLOs

1. Open Grafana dashboard at http://localhost:3000
2. Check SLI/SLO panels for availability, latency, error rate
3. Verify error budget consumption
4. Trigger alerts by increasing error rate in k6 test

## Screenshots

### SLI/SLO Dashboard
> *(Add Grafana screenshot showing availability, latency, error rate panels)*

### Error Budget Dashboard
> *(Add Grafana screenshot showing error budget burn rate)*

### Burn-Rate Alerts
> *(Add Alertmanager screenshot showing multi-window burn-rate alerts)*

## What I Learned

- Defining meaningful SLIs that reflect user experience
- Implementing SLOs with Prometheus recording rules
- Building multi-window burn-rate alerts (1h, 6h, 24h)
- Creating actionable Grafana dashboards for SRE teams
- Using Sloth for SLO-as-code workflow
- Load testing with k6 to validate SLO targets
- Integrating observability into Kubernetes platforms

## Next Improvements

- [ ] Add ServiceNow integration for incident auto-creation on SLO breach
- [ ] Implement distributed tracing with Jaeger
- [ ] Add custom business-level SLIs (e.g., checkout success rate)
- [ ] Create Terraform modules for reproducible deployment
- [ ] Add chaos engineering with Chaos Mesh to test SLO resilience

## References

- [Google SRE Book - SLIs, SLOs, and SLAs](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Sloth - SLO management for Prometheus](https://github.com/slok/sloth)
- [Pyrra - SLOs for Kubernetes](https://github.com/pyrra-dev/pyrra)
- [k6 - Load testing tool](https://github.com/grafana/k6)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

---
*Created by jgramesh - DevOps/Platform Engineer | 15+ years experience in Kubernetes, AWS, Linux, Jenkins, GitLab CI*
