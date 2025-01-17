Case Study: Automating Kubernetes Deployment on Google Cloud Platform Using Terraform, Ansible, and Jenkins
Overview
This case study demonstrates the implementation of a Continuous Integration/Continuous Deployment (CI/CD) pipeline using Terraform, Ansible, and Jenkins on Google Cloud Platform (GCP). The objective is to automate the setup and management of a Kubernetes cluster on GCP, and to integrate Jenkins for continuous deployment, ensuring that application updates occur without downtime.
Objectives
	•	Setup a Kubernetes cluster on GCP using Terraform.

	•	Configure the cluster with Ansible to ensure consistency and automation.
	•	Integrate Jenkins with the Kubernetes cluster for CI/CD.
	•	Automate the deployment process such that any code pushed to GitHub triggers a Jenkins job.
	•	Deploy Docker containers to the Kubernetes cluster with zero downtime.


Architecture Overview
	1.	Google Cloud Platform (GCP): Used for hosting the Kubernetes cluster.
	2.	Terraform: Infrastructure as Code (IaC) tool used to provision GCP resources including the Kubernetes cluster.
	3.	Ansible: Configuration management tool used to configure and manage the Kubernetes cluster.
	4.	Jenkins: CI/CD tool used to automate the build, test, and deployment pipeline.
	5.	GitHub: Source code repository that triggers the CI/CD pipeline on every code push.
	6.	Docker: Containerization platform for building and managing application images.





Step-by-Step Implementation
1. Setup Kubernetes Cluster on GCP with Terraform
	•	Create a GCP Project: Start by creating a new project in the GCP Console. Enable the necessary APIs (Compute Engine API, Kubernetes Engine API, etc.).

Solution: created a gcp project : poc-project-gcp 
enabled all the neccessary api like container, serviceusae, kubernetes engine api )

https://console.cloud.google.com/apis/library/browse?project=montgomery-434711-c5&q=kubernetes


	•	Write Terraform Configuration:
	◦	Define the provider block for GCP in the Terraform script.
	◦	Use google_container_cluster resource to create a Kubernetes cluster on GCP.
	◦	Specify node count, machine type, and other cluster configurations.
 hclCopy codeprovider "google" {
  credentials = file("<path-to-service-account-json>")
  project     = "<your-project-id>"
  region      = "us-central1"
}

resource "google_container_cluster" "primary" {
  name     = "primary-k8s-cluster"
  location = "us-central1"

  initial_node_count = 3

  node_config {
    machine_type = "n1-standard-1"
  }
}

	•	Deploy the Cluster:
	◦	Initialize Terraform with terraform init.
	◦	Plan and apply the changes using terraform plan and terraform apply.


Solution: tried with the above code but it didnt work, it was not lettin me create th k8s cluster , so i used terraform-google-ke repo
Solution: 
invoked terraform code https://github.com/djay21/GCP-CICD-DEMO/tree/main/terraform-google-gke/examples/gke-public-cluster
module location: https://github.com/djay21/GCP-CICD-DEMO/tree/main/terraform-google-gke/modules/gke-cluster
above link contains terraform which created the k8s cluster , node pool and vpc and service account


p**********************************
	1. i create a service account gcp-poc through gcp console and exported keys. ythis keys will be further used by local systemt o authentciate the gcloud ofr terraform.
Also i created a n s3 bucket manually, so that i can keep the terraform bakcend remote state over there .
below is the code for that
```
terraform {
  backend "gcs" {
    bucket = "tf-state-gcp-test"  
    prefix = "terraform"     
  }
}
```

2. go to this location GCP-CICD-DEMO/terraform-google-gke/examples/gke-public-cluster and run 
'''
terraform init
terraform plan #it will tell you what resources its gonna recreate 
terraform apply -auto-approve # will create the resources
''''


the above folder contains code for creation of k8s cluster , a nod e pool, vpc subnet and its config and a service account which will be used within k8s cluster . 
****************************]]]]]]]]]****************************







2. Configure Kubernetes Cluster with Ansible
	•	Inventory and Playbook Setup:
	◦	Define an Ansible inventory file that contains the GCP Kubernetes cluster.
	◦	Write an Ansible playbook to configure the Kubernetes cluster, install necessary tools (e.g., Helm, kubectl), and set up namespaces, RBAC, etc.
 yamlCopy code- hosts: alltasks:- name: Ensure kubectl is installedapt:name: kubectlstate: present- name: Install Helmshell: curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash

	•	Run Ansible Playbook:
	◦	Use ansible-playbook command to apply the configuration to the cluster.

Solution: https://github.com/djay21/GCP-CICD-DEMO/blob/main/ansible/playbook.yaml
Since the node created by the terraform in gke cluster is cos_containerd image, we dont have option to install anything in that , kubectl already come installed by default. So since we had jenkins installed in our pod, so this ansible is bein run in the jenkins pods for the neccessary tools insatiion like kubectl, helm, gcloud etc. 



steps: we went into k8s pod name jenkins inside jenkins namespace

kubectl -n jenkins exec -it jenkins_pod_nmae -- bash 
now after running above comand we will be inside jenkins pod, now run the ansible playbook. 


apt update -y 
apt install ansible -y 

the ansible playbook i put it inside manually /var/jenkins_home/ansible/playbook.yaml
go to te above locatoonand run 
'''
ansible-playbook playbook.yaml
'''
it will install all the neccessary package defined in the playbook/




3. Set Up Jenkins and Integrate with Kubernetes
	•	Install Jenkins:
	◦	Deploy Jenkins on a VM within GCP or as a service within the Kubernetes cluster.

	Solution: installed in k8s pods
	◦	Configure Jenkins with necessary plugins (e.g., Kubernetes, GitHub, Docker, etc.).

	olution: instaklled all while confuguring jenkins at the startup
	•	Connect Jenkins with Kubernetes:
	solution: this part we are doing via scritped jenkins pipeline 
     https://github.com/djay21/GCP-CICD-DEMO/blob/main/node-js-sample/Jenkinsfile


	◦	Configure Jenkins to interact with the Kubernetes cluster using the Kubernetes plugin. Set up Kubernetes as a cloud provider within Jenkins.
solution: we are making use of gcloud command to configure the k8s cluster credentials inside the jobs. 


	•	Configure Jenkins Pipeline:
	 SOlution:    https://github.com/djay21/GCP-CICD-DEMO/blob/main/node-js-sample/Jenkinsfile


	◦	Create a Jenkins pipeline (either scripted or declarative) that:

	Sokution:   https://github.com/djay21/GCP-CICD-DEMO/blob/main/node-js-sample/Jenkinsfile


	▪	Triggers on code pushes to the GitHub repository.
	▪	Builds a Docker image.
	▪	Pushes the Docker image to a Docker registry (e.g., Docker Hub, GCR).
Solution: here we are using gcr , which we manually created from the console and we are pushing the image over there and the same image is being used in the deployment. 
https://console.cloud.google.com/artifacts/docker/montgomery-434711-c5/us-central1/gcp-demo?project=montgomery-434711-c5

	▪	Deploys the Docker container to the Kubernetes cluster.
 groovyCopy codepipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                script {
                    docker.build("my-app:${env.BUILD_ID}").push()
                }
            }
        }
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    kubernetesDeploy(
                        configs: 'k8s-deployment.yaml',
                        kubeconfigId: 'kubeconfig',
                        enableConfigSubstitution: true
                    )
                }
            }
        }
    }
}


Solution: Installed jenkins in k8s pods. 
https://github.com/djay21/GCP-CICD-DEMO/blob/main/kubernetes-jenkins/deployment.yaml


Pre requisiteL: make sure you are authenticate with google, gcloud

command: gcloud auth login 
and then you can authenticate to k8s cluster 

command: gcloud container clusters get-credentials primary-k8s --zone us-central1-a --project montgomery-434711-c5


above comamnd will conifgure kubeconfi in our system so taht we can run kubetcl comamnds, without this kubectl command wont work.

Go to the [above](https://github.com/djay21/GCP-CICD-DEMO/blob/main/kubernetes-jenkins) location and run 
'''
kubectl apply -f . 
'''

it will deploy the jenkins pods, service, pvc , dind container( for docker to run inside jenkins pods) 







4. Automate Code Deployment with GitHub Webhooks
	•	GitHub Webhook Setup:
	◦	Set up a webhook in the GitHub repository that triggers Jenkins on every code push.
	•	Jenkins Job Configuration:
	◦	Ensure that the Jenkins job is configured to poll GitHub or use the webhook to start the pipeline.
SOlution : we used poll github

Whene anything ill be pushed to main branch of the github/GCP-CICD-DEMO then it will be automatically ttrigger bcz poll scm being used and it detects any changes it will run autmaticaly





5. Deploy Application with Zero Downtime
	•	Kubernetes Deployment Strategy:
	◦	Implement a rolling update strategy in the Kubernetes deployment manifests.
	◦	This ensures that when a new version of the application is deployed, the old pods are gradually replaced with new ones, ensuring no downtime.
 yamlCopy codeapiVersion: apps/v1kind: Deploymentmetadata:name: my-appspec:replicas: 3strategy:type: RollingUpdaterollingUpdate:maxUnavailable: 1maxSurge: 1template:metadata:labels:app: my-appspec:containers:- name: my-app-containerimage: "my-app:${BUILD_ID}"


 Solution: https://github.com/djay21/GCP-CICD-DEMO/blob/main/node-js-sample/k8s/deployment.yaml

Results
	•	Automated Deployment: The integration of Terraform, Ansible, and Jenkins on GCP provides a seamless, automated deployment pipeline.
	•	Zero Downtime: With Kubernetes’ rolling updates, application updates are deployed without affecting availability.
	•	Scalability: The setup is scalable, allowing the Kubernetes cluster to handle increasing loads by adjusting the number of nodes or replicas.
Conclusion
This case study outlines a robust CI/CD pipeline leveraging Terraform, Ansible, and Jenkins on Google Cloud Platform. The automation ensures efficient deployment processes, minimal human intervention, and the capability to maintain high availability with zero downtime during application updates. This approach is highly beneficial for development teams aiming to accelerate their deployment cycles while maintaining reliability and scalability.