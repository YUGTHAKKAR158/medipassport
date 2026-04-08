import boto3
import uuid
import os
from flask import current_app

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=current_app.config['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=current_app.config['AWS_SECRET_ACCESS_KEY'],
        region_name=current_app.config['AWS_REGION']
    )

def upload_file_to_s3(file, original_filename):
    ext = original_filename.rsplit('.', 1)[1].lower()
    filename = str(uuid.uuid4()) + '.' + ext
    
    s3 = get_s3_client()
    bucket = current_app.config['AWS_BUCKET_NAME']
    region = current_app.config['AWS_REGION']
    
    s3.upload_fileobj(
        file,
        bucket,
        filename,
        ExtraArgs={'ContentType': file.content_type}
    )
    
    url = 'https://' + bucket + '.s3.' + region + '.amazonaws.com/' + filename
    return url

def delete_file_from_s3(file_url):
    try:
        bucket = current_app.config['AWS_BUCKET_NAME']
        filename = file_url.split('/')[-1]
        s3 = get_s3_client()
        s3.delete_object(Bucket=bucket, Key=filename)
    except Exception as e:
        print('S3 delete error:', e)