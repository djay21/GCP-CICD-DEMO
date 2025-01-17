# GCP-CICD-DEMO
"Demo repository showcasing a CI/CD pipeline on Google Cloud Platform (GCP) for automated deployment and infrastructure management."

## Automating Kubernetes Deployment on GCP Using Terraform, Ansible, and Jenkins

## Overview
This repository demonstrates the implementation of a CI/CD pipeline on Google Cloud Platform (GCP) to automate Kubernetes cluster setup and deployment using **Terraform**, **Ansible**, and **Jenkins**. The goal is to create a seamless pipeline that automatically deploys applications to a Kubernetes cluster with zero downtime.

## Objectives
- Set up a Kubernetes cluster on GCP using **Terraform**.
- Automate cluster configuration with **Ansible**.
- Integrate **Jenkins** for continuous integration and deployment (CI/CD).
- Trigger Jenkins builds on every code push to GitHub.
- Deploy Docker containers to the Kubernetes cluster with **zero downtime**.

## Architecture Overview
1. **GCP**: Hosting the Kubernetes cluster.
2. **Terraform**: Provisioning GCP resources, including the Kubernetes cluster.
3. **Ansible**: Configuring the Kubernetes cluster and installing necessary tools.
4. **Jenkins**: Automating build, test, and deployment pipelines.
5. **GitHub**: Triggering the CI/CD pipeline on code pushes.
6. **Docker**: Containerizing application code for deployment.

## Step-by-Step Implementation

### 1. **Kubernetes Cluster Setup with Terraform**
   - Provisioned a GCP project and enabled necessary APIs (Compute Engine, Kubernetes Engine).
   - Used Terraform to create the Kubernetes cluster, node pools, VPC, and service accounts.
   - Configuration details available in the `terraform-google-gke` module.  
   - Remote state management was handled using Google Cloud Storage (GCS).

### 2. **Configure Kubernetes Cluster with Ansible**
   - Created an Ansible playbook to install **kubectl**, **Helm**, and configure the Kubernetes environment.
   - Ran the playbook within a Jenkins pod on the Kubernetes cluster.

### 3. **Jenkins Setup and Integration**
   - Installed Jenkins within Kubernetes using a pod-based deployment.
   - Configured Jenkins to interact with the Kubernetes cluster using the **Kubernetes plugin**.
   - Created a Jenkins pipeline that:
     - Triggers on GitHub pushes.
     - Builds and pushes Docker images to Google Container Registry (GCR).
     - Deploys the Docker container to the Kubernetes cluster using Kubernetes manifests.

### 4. **Automate Deployment with GitHub Webhooks**
   - Configured a GitHub webhook to trigger Jenkins jobs on code pushes to the `main` branch.
   - Jenkins job polls GitHub for changes and automatically triggers the pipeline.

### 5. **Zero Downtime Application Deployment**
   - Implemented a **Rolling Update** strategy in Kubernetes to ensure that application updates occur without downtime.
   - Kubernetes ensures that new versions of the app are rolled out gradually, keeping the service available.

## Results
- **Automated Deployment**: Terraform, Ansible, and Jenkins work seamlessly to automate the deployment pipeline.
- **Zero Downtime**: Kubernetes’ rolling update strategy ensures smooth deployments without service interruptions.
- **Scalability**: The system is scalable, and the Kubernetes cluster can automatically scale to meet the demand.

## Conclusion
This case study showcases a robust CI/CD pipeline using **Terraform**, **Ansible**, and **Jenkins** on GCP to automate Kubernetes cluster deployment and application delivery. The solution ensures fast, reliable, and zero-downtime deployments, enhancing development velocity while maintaining system reliability. 

For detailed setup and implementation, refer to the [Terraform and Kubernetes setup](./terraform-google-gke) and [Jenkins pipeline configuration](./node-js-sample/Jenkinsfile).
