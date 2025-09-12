terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # This will be configured in the CI/CD pipeline
  }
}

provider "aws" {
  region = "ap-southeast-1"
}

resource "aws_s3_bucket" "assets" {
  bucket = "vietnam-lounge-assets"

  tags = {
    Name        = "Vietnam Lounge Assets"
    Project     = "vietnam-lounge"
    ManagedBy   = "Terraform"
  }
}
