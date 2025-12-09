variable "aws_region" {
  description = "The AWS region to create resources in."
  type        = string
  default     = "ap-southeast-1"
}

variable "bucket_name" {
  description = "The name of the S3 bucket for storing assets."
  type        = string
  default     = "vietnam-lounge-assets"
}
