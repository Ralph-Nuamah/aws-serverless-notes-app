import json
import boto3
import uuid
import time
import os

TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'NotesTable')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    # Define CORS headers
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept', # More comprehensive
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }

    # Handle OPTIONS preflight request
    if event.get('httpMethod') == 'OPTIONS' or event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        print("Handling OPTIONS request")
        return {
            'statusCode': 204, # No Content for OPTIONS is common
            'headers': cors_headers,
            'body': '' # Empty body for OPTIONS
        }

    # Proceed with POST request logic
    try:
        print(f"Received event: {event}") # Log the event for debugging

        if isinstance(event.get('body'), str):
            body = json.loads(event.get('body', '{}'))
        else:
            body = event.get('body', {})

        content = body.get('content')

        if not content:
            print("Content is missing from request body")
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Content is required'})
            }

        note_id = str(uuid.uuid4())
        timestamp = int(time.time())

        item = {
            'noteId': note_id,
            'content': content,
            'createdAt': timestamp
        }

        print(f"Putting item into DynamoDB: {item}")
        table.put_item(Item=item)
        print("Item successfully put into DynamoDB")

        return {
            'statusCode': 201,
            'headers': cors_headers,
            'body': json.dumps({'noteId': note_id, 'message': 'Note created successfully'})
        }

    except json.JSONDecodeError as e:
        print(f"JSONDecodeError: {e} - Body was: {event.get('body')}")
        return {
            'statusCode': 400, # Bad Request for JSON parsing issues
            'headers': cors_headers,
            'body': json.dumps({'error': f'Invalid JSON format: {str(e)}'})
        }
    except Exception as e:
        print(f"Error processing request: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }