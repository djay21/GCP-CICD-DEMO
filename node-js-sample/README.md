Jenkins CI/CD Pipeline for GCP Kubernetes Deployment
This README provides a detailed explanation of the Jenkins pipeline used to build, push, and deploy a Dockerized Node.js application to Google Kubernetes Engine (GKE). The pipeline includes multiple stages from code checkout to cleanup, leveraging Google Cloud Platform (GCP) and Docker.

Jenkins url: 
http://34.30.99.80:8080/
Username: admin
password: 0f4a698cd42749318cdf9d8a3d1a42e9

Prerequisites
Before running this pipeline, ensure the following prerequisites are met:

Jenkins Setup:

Jenkins is installed and configured. In our case, it is running as a pod in k8s( jenkins namespace, the code for the same can be found in the previous directory named kubernetes-jenkins)

Jenkins agents are capable of running Docker commands (Docker-in-Docker setup which is leveraging another pod named dind-fbb44fb6b-jj9xs ).

Jenkins has access to required cli and sdk which has been installed by the ansible playbook inside the jenkins pod. the location of the playbook can be found inside /var/jenkins_home/ansible/playbook.yaml) same can be found in the ansible folder in the repo.


Google Cloud Platform:

A GCP project is set up (test-c5 in this case).
A Google Service Account with necessary permissions (e.g., Kubernetes Engine Admin, Container Registry Admin).
The Service Account credentials are stored in Jenkins as a secret file credential (gcp_access).
gcp_access contains the service account json file which was generated from the console manually.

Cluster creation is done through terraform. code can be found in terraform-google-gke.

Kubernetes:

A GKE cluster named primary-k8s is available and accessible.
Pipeline Environment Variables
The pipeline uses the following environment variables:

PROJECT_ID: GCP Project ID.
IMAGE_NAME: Name of the Docker image (in the format repository/image-name).
APP_NAME: Application name used in Kubernetes manifests.
DOCKER_HOST: Docker host address (configured for Docker-in-Docker).
IMAGE_TAG: Tag for the Docker image, usually the build number.
CLUSTER_NAME: Name of the Kubernetes cluster.
GCR_REGISTRY: Google Container Registry URL.
GCR_IMAGE: Complete Docker image URL including registry, project ID, image name, and tag.
GOOGLE_APPLICATION_CREDENTIALS: Path to the GCP Service Account credentials file within Jenkins.
Pipeline Stages
1. Checkout
This stage checks out the source code from the version control system defined in Jenkins (e.g., Git).

groovy
Copy code
stage('Checkout') {
    steps {
        checkout scm
    }
}
2. Activating GCP Service Account
This stage activates the Google Cloud Service Account using the credentials stored in Jenkins. It authenticates Docker to push images to Google Container Registry (GCR).

groovy
Copy code
stage('Activating GCP SA') {
    steps {
        script {
            sh """
            ## Activating Google Service Account 
            cat $GOOGLE_APPLICATION_CREDENTIALS > abc.json
            gcloud auth activate-service-account gcp-poc@testc5.iam.gserviceaccount.com --key-file=abc.json
            gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin https://us-central1-docker.pkg.dev
            
            ## Build the Docker image
            cd node-js-sample
            docker build -t ${GCR_IMAGE} .
            docker images -a
            """
        }
    }
}
3. Push to Google Container Registry
This stage pushes the Docker image built in the previous stage to GCR.

groovy
Copy code
stage('Push to Google Container Registry') {
    steps {
        script {
            sh """
            docker push ${GCR_IMAGE}
            """
        }
    }
}
4. Deploy to Kubernetes
In this stage, the pipeline updates Kubernetes deployment and service manifests with the current image and application name, then applies the changes to the GKE cluster.

groovy
Copy code
stage('Deploy to Kubernetes') {
    steps {
        script {
            sh """
            gcloud container clusters get-credentials ${CLUSTER_NAME} --zone us-central1-a --project ${PROJECT_ID}
            cd node-js-sample
            sed -i "s|APP_NAME|${APP_NAME}|" k8s/deployment.yaml
            sed -i "s|IMAGE_NAME|${GCR_IMAGE}|" k8s/deployment.yaml
            sed -i "s|APP_NAME|${APP_NAME}|" k8s/service.yaml
            cat k8s/deployment.yaml
            kubectl apply -f k8s/
            """
        }
    }
}
5. Remove Local Docker Images
This stage removes the Docker image from the local Docker registry to free up space.

groovy
Copy code
stage('Remove local docker images') {
    steps {
        script {
            sh """
            docker rmi -f ${GCR_IMAGE}
            """
        }
    }
}
Additional Notes
Ensure that the Kubernetes deployment and service YAML files are correctly set up with placeholders for APP_NAME and IMAGE_NAME to facilitate replacements during the deployment stage.


The pipeline uses Docker-in-Docker (DOCKER_HOST = "tcp://dind-service:2375") to build and push Docker images. Ensure the Jenkins environment supports Docker-in-Docker configurations.
there is already a docker in docker pod running in jenkins namespace which provides docker daemon configuration for the docker client running in jenkins namespace. The DOCKER_HOST environment is pointing to the dind pod,and dind-service is the name of the service of the pod in jenkins namespace.Every image build through docker, will use the dind pods. 



Troubleshooting steps: 
Authentication Errors: Ensure the Service Account credentials are correct and have necessary permissions.
Docker Errors: Check that the Docker daemon is running and accessible via the configured DOCKER_HOST.
Kubernetes Deployment Issues: Verify the GKE cluster credentials and ensure the manifests are correctly formatted and applied.
This README should help you understand and run the Jenkins pipeline successfully. If you encounter any issues, refer to the troubleshooting section or consult relevant Jenkins and GCP documentation.