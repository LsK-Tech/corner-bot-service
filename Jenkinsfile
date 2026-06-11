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

                        envsubst < deploy/prod/docker-stack.yml > /tmp/corner-bot-stack.yml

                        docker stack deploy \
                            --compose-file /tmp/corner-bot-stack.yml \
                            --with-registry-auth \
                            corner-bot
                    '''
                }
            }
            post {
                always { sh 'rm -f /tmp/corner-bot-stack.yml || true' }
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