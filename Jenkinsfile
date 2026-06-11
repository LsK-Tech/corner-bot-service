pipeline {
    agent { label 'App-Mansão-Green' }

    environment {
        REGISTRY    = 'ghcr.io/lsk-tech'
        IMAGE_NAME  = 'corner-bot-service'
        STACK_NAME  = 'corner-bot'
        DEPLOY_FILE = 'deploy/prod/docker-stack.yml'
        VPS_HOST    = '62.171.139.118'
        VPS_USER    = 'root'
    }

    stages {
        stage('Build & Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'GHCR_USER',
                    passwordVariable: 'GHCR_TOKEN'
                )]) {
                    sh '''
                        echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

                        IMAGE_TAG=${GIT_COMMIT:0:7}

                        docker build -t $REGISTRY/$IMAGE_NAME:$IMAGE_TAG .
                        docker push $REGISTRY/$IMAGE_NAME:$IMAGE_TAG

                        docker tag $REGISTRY/$IMAGE_NAME:$IMAGE_TAG $REGISTRY/$IMAGE_NAME:latest
                        docker push $REGISTRY/$IMAGE_NAME:latest
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'vps-62-ssh',
                        keyFileVariable: 'SSH_KEY'
                    ),
                    string(credentialsId: 'corner-bet-username',   secretVariable: 'CORNER_BET_USERNAME'),
                    string(credentialsId: 'corner-bet-password',   secretVariable: 'CORNER_BET_PASSWORD'),
                    string(credentialsId: 'corner-bet-api-url',    secretVariable: 'GAME_COMPACT_API_URL'),
                    string(credentialsId: 'corner-bet-api-token',  secretVariable: 'GAME_COMPACT_API_TOKEN'),
                    string(credentialsId: 'corner-bet-sentry-dsn', secretVariable: 'SENTRY_DSN'),
                    string(credentialsId: 'corner-bet-tz',         secretVariable: 'TZ')
                ]) {
                    sh '''
                        IMAGE_TAG=${GIT_COMMIT:0:7}

                        envsubst < $DEPLOY_FILE > /tmp/corner-bot-stack.yml

                        scp -i $SSH_KEY -o StrictHostKeyChecking=no \
                            /tmp/corner-bot-stack.yml \
                            $VPS_USER@$VPS_HOST:/tmp/corner-bot-stack.yml

                        ssh -i $SSH_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST \
                            "docker stack deploy -c /tmp/corner-bot-stack.yml $STACK_NAME --with-registry-auth"
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout ghcr.io || true'
        }
    }
}