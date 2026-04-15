# Product Reliability SLO Lab

## Overview
Own SLIs/SLOs and monitoring for assigned products/platforms. This lab demonstrates implementing observability tools and dashboards for proactive performance management using Prometheus, Grafana, Sloth, Alertmanager, and k6.
## 15-Day Learning Plan

> Complete this hands-on lab over 15 days to master Product Reliability, SLIs, SLOs, and observability with real tools.

---

### Phase 1: Foundation (Days 1-5)

#### Day 1 - Introduction to SRE & Reliability Concepts
- Read Google SRE Book chapters on SLIs, SLOs, and Error Budgets
- Understand the difference between SLA, SLO, and SLI
- Study the `slo/` folder files in this repo
- Define what "reliability" means for your product/platform
- **Deliverable**: Write down 3 SLIs for your assigned product

#### Day 2 - Setting Up the Lab Environment
- Install Docker, Docker Compose, and kubectl
- Set up a local Kubernetes cluster using kind or minikube
- Clone this repository: `git clone https://github.com/jgramesh/product-reliability-slo-lab`
- Explore the folder structure and understand each component
- **Deliverable**: Working local K8s cluster with repo cloned

#### Day 3 - Prometheus Fundamentals
- Learn Prometheus architecture (scrape, storage, query)
- Deploy Prometheus in your K8s cluster using Helm
- Understand PromQL basics (rate, sum, histogram_quantile)
- Study `prometheus/slo-rules.yml` for recording rules
- **Deliverable**: Prometheus running and querying metrics

#### Day 4 - Defining Your SLIs & SLOs
- Review `slo/availability-slo.yml` and `slo/latency-slo.yml`
- Define SLOs for your product using the same YAML format
- Calculate your error budget (e.g., 99.9% = 0.1% error budget)
- Map SLIs to actual Prometheus metrics
- **Deliverable**: Your own SLO YAML specification file

#### Day 5 - Prometheus Recording Rules for SLOs
- Understand how recording rules work in Prometheus
- Study multi-window burn rate calculations
- Apply `prometheus/slo-rules.yml` to your cluster
- Query and verify SLO metrics in Prometheus UI
- **Deliverable**: SLO recording rules working in Prometheus

---

### Phase 2: Implementation (Days 6-10)

#### Day 6 - Grafana Dashboards
- Deploy Grafana alongside Prometheus
- Learn Grafana basics (datasources, panels, queries)
- Import `grafana/sli-slo-dashboard.json`
- Customize dashboard with your product's SLIs
- **Deliverable**: Working SLI/SLO dashboard in Grafana

#### Day 7 - Error Budget Visualization
- Understand error budget consumption concepts
- Create error budget panels in Grafana
- Set up burn rate visualization
- Configure dashboard refresh intervals
- **Deliverable**: Error budget dashboard with burn rate charts

#### Day 8 - Alerting with Alertmanager
- Deploy Alertmanager in your cluster
- Study `prometheus/alert-rules.yml` for burn-rate alerts
- Understand alert thresholds (14.4x, 6x, 3x burn rate)
- Configure notification channels (email, Slack, PagerDuty)
- **Deliverable**: Working SLO burn-rate alerts

#### Day 9 - Load Testing with k6
- Install k6 load testing tool
- Study `k6/load-test.js` script structure
- Run baseline load tests against your product
- Measure actual SLI performance under load
- **Deliverable**: k6 load test results with SLI metrics

#### Day 10 - SLO Validation & Testing
- Run k6 tests with different load patterns
- Verify SLO compliance (availability > 99.9%, p95 latency < 500ms)
- Trigger SLO violations intentionally to test alerts
- Document findings and SLO gaps
- **Deliverable**: SLO validation report with test results

---

### Phase 3: Production Readiness (Days 11-15)

#### Day 11 - Kubernetes Integration
- Study `k8s/deployment.yaml` for app deployment
- Deploy your product using the K8s manifests
- Configure health probes (liveness, readiness, startup)
- Enable Prometheus annotations for metrics scraping
- **Deliverable**: Product deployed on K8s with health probes

#### Day 12 - Horizontal Pod Autoscaling
- Study `k8s/hpa.yaml` for autoscaling configuration
- Deploy HPA for your product
- Test autoscaling under k6 load
- Verify scaling behavior meets SLO targets
- **Deliverable**: Working HPA with scaling metrics

#### Day 13 - Service Mesh & Advanced Observability
- Research service mesh options (Istio, Linkerd)
- Understand how service mesh enhances observability
- Plan integration with existing Prometheus/Grafana
- Document service mesh SLO benefits
- **Deliverable**: Service mesh evaluation document

#### Day 14 - Runbook & Incident Response
- Create an incident runbook for SLO breaches
- Define escalation procedures (alert -> ticket -> page)
- Document troubleshooting steps for common SLO issues
- Practice responding to simulated SLO violations
- **Deliverable**: Complete SLO incident runbook

#### Day 15 - Review, Document & Share
- Review all work completed over 15 days
- Document lessons learned and improvements
- Create a presentation of your SLO implementation
- Share your repo and findings with your team
- **Deliverable**: Final presentation and knowledge transfer

---

### Learning Checklist

- [ ] Day 1: SRE fundamentals understood
- [ ] Day 2: Lab environment ready
- [ ] Day 3: Prometheus deployed and querying
- [ ] Day 4: Personal SLOs defined
- [ ] Day 5: Recording rules implemented
- [ ] Day 6: Grafana dashboards created
- [ ] Day 7: Error budget visualized
- [ ] Day 8: Burn-rate alerts working
- [ ] Day 9: k6 load tests executed
- [ ] Day 10: SLOs validated with tests
- [ ] Day 11: Product on Kubernetes
- [ ] Day 12: HPA configured and tested
- [ ] Day 13: Service mesh evaluated
- [ ] Day 14: Incident runbook created
- [ ] Day 15: Knowledge shared and documented

---

### Tools Used

| Tool | Purpose | Day |
|------|---------|-----|
| Kubernetes (kind/minikube) | Local cluster | Day 2 |
| Prometheus | Metrics & SLO recording | Day 3-5 |
| Grafana | Dashboards & visualization | Day 6-7 |
| Alertmanager | Burn-rate alerting | Day 8 |
| k6 | Load testing & SLO validation | Day 9-10 |
| Helm | Package management | Day 3 |
| kubectl | Cluster management | Day 2-12 |
| Sloth | SLO-as-code (optional) | Day 4-5 |

---

### Tips for Success

1. **Start simple** - Focus on one SLI at a time
2. **Measure real metrics** - Use actual production-like traffic
3. **Iterate on SLOs** - Your first SLOs won't be perfect
4. **Involve stakeholders** - Get product team input on SLO targets
5. **Automate everything** - Use GitOps for SLO configurations
6. **Document as you go** - Keep a learning journal
7. **Practice incident response** - Simulate SLO breaches
8. **Share knowledge** - Teach others what you learned

---

### Expected Outcomes

By completing this 15-day plan, you will be able to:

- Define meaningful SLIs and SLOs for any product or platform
- Implement SLO monitoring using Prometheus and Grafana
- Configure multi-window burn-rate alerting
- Run load tests to validate SLO compliance
- Deploy and manage SLO infrastructure on Kubernetes
- Create incident runbooks for SLO breaches
- Communicate reliability metrics to stakeholders

---


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
