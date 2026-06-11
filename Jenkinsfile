pipeline {

    agent { label 'App-Mansão-Green' }

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'mg-docker-registry',
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_PASSWORD'
                )]) {
                    sh '''
                        printf '%s' "$REGISTRY_PASSWORD" | docker login ghcr.io --username "$REGISTRY_USER" --password-stdin

                        IMAGE_TAG=$(echo $GIT_COMMIT | cut -c1-7)

                        docker build -t ghcr.io/lsk-tech/corner-bot-service:$IMAGE_TAG .
                        docker push ghcr.io/lsk-tech/corner-bot-service:$IMAGE_TAG

                        docker tag ghcr.io/lsk-tech/corner-bot-service:$IMAGE_TAG ghcr.io/lsk-tech/corner-bot-service:latest
                        docker push ghcr.io/lsk-tech/corner-bot-service:latest
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    string(credentialsId: 'corner-bet-username',   variable: 'CORNER_BET_USERNAME'),
                    string(credentialsId: 'corner-bet-password',   variable: 'CORNER_BET_PASSWORD'),
                    string(credentialsId: 'corner-bet-api-url',    variable: 'GAME_COMPACT_API_URL'),
                    string(credentialsId: 'corner-bet-api-token',  variable: 'GAME_COMPACT_API_TOKEN'),
                    string(credentialsId: 'corner-bet-sentry-dsn', variable: 'SENTRY_DSN'),
                    string(credentialsId: 'corner-bet-tz',         variable: 'TZ'),
                    usernamePassword(
                        credentialsId: 'mg-docker-registry',
                        usernameVariable: 'REGISTRY_USER',
                        passwordVariable: 'REGISTRY_PASSWORD'
                    )
                ]) {
                    sh '''
                        printf '%s' "$REGISTRY_PASSWORD" | docker login ghcr.io --username "$REGISTRY_USER" --password-stdin

                        docker stop corner-bot-service || true
                        docker rm corner-bot-service || true

                        docker run -d \
                            --name corner-bot-service \
                            --restart unless-stopped \
                            --shm-size="2gb" \
                            --add-host=host.docker.internal:host-gateway \
                            --network mansao-green-prod_web-net \
                            -e CORNER_BET_USERNAME="$CORNER_BET_USERNAME" \
                            -e CORNER_BET_PASSWORD="$CORNER_BET_PASSWORD" \
                            -e GAME_COMPACT_API_URL="$GAME_COMPACT_API_URL" \
                            -e GAME_COMPACT_API_TOKEN="$GAME_COMPACT_API_TOKEN" \
                            -e SENTRY_DSN="$SENTRY_DSN" \
                            -e TZ="$TZ" \
                            ghcr.io/lsk-tech/corner-bot-service:latest
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout ghcr.io || true'
            cleanWs()
        }
    }
}