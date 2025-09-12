# Infrastructure

This directory contains all the infrastructure-as-code (IaC) for the Vietnam Lounge project.

## Subdirectories

- **/aws**: Contains infrastructure definitions for services hosted on Amazon Web Services (AWS). This is managed using Terraform.
  - `terraform/`: Contains the Terraform configuration files.
  - `policies/`: Contains IAM policy JSON documents.

- **/firebase**: Contains configuration files specific to Firebase that aren't part of the root Firebase project setup.
  - `hosting.rewrites.json`: Defines rewrite rules for Firebase Hosting, likely for routing requests to Cloud Functions.

## Usage

Please refer to the README file within each subdirectory for specific instructions on how to apply or manage the infrastructure.
