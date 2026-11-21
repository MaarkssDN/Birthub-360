# Agente 91 (Terra) — Backend Terraform S3 com State Lock via DynamoDB (Onda 2)
terraform {
  required_version = ">= 1.6.0"

  backend "s3" {
    bucket         = "birthhub360-terraform-state"
    key            = "prod/infrastructure.tfstate"
    region         = "sa-east-1"
    encrypt        = true
    dynamodb_table = "birthhub360-terraform-locks"
  }
}
