pipeline {
    agent none
    options {
        disableConcurrentBuilds()
        timestamps()
    }
    stages {
        stage('Checkout') {
            agent { label 'App-Mansão-Green' }
            steps {
                checkout scm
            }
        }

        stage('Build & Push') {
            agent { label 'App-Mansão-Green' }
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

        stage('Deploy QA') {
            when { branch 'develop' }
            agent { label 'Servidor-de-teste' }
            steps {
                withCredentials([
                    string(credentialsId: 'corner-bet-username',     variable: 'CORNER_BET_USERNAME'),
                    string(credentialsId: 'corner-bet-password',     variable: 'CORNER_BET_PASSWORD'),
                    string(credentialsId: 'corner-bet-api-url-qa',   variable: 'GAME_COMPACT_API_URL'),
                    string(credentialsId: 'corner-bet-api-token',    variable: 'GAME_COMPACT_API_TOKEN'),
                    string(credentialsId: 'corner-bet-sentry-dsn',   variable: 'SENTRY_DSN'),
                    string(credentialsId: 'corner-bet-tz',           variable: 'TZ'),
                    usernamePassword(
                        credentialsId: 'mg-docker-registry',
                        usernameVariable: 'REGISTRY_USER',
                        passwordVariable: 'REGISTRY_PASSWORD'
                    )
                ]) {
                    sh '''
                        printf '%s' "$REGISTRY_PASSWORD" | docker login ghcr.io --username "$REGISTRY_USER" --password-stdin
                        IMAGE_TAG=$(echo $GIT_COMMIT | cut -c1-7)
                        NETWORK_NAME=mansao-green-qa_web-net
                        export IMAGE_TAG NETWORK_NAME
                        envsubst < docker-compose.yml > /tmp/corner-bot-qa-stack.yml
                        docker stack deploy \
                            --compose-file /tmp/corner-bot-qa-stack.yml \
                            --with-registry-auth \
                            --resolve-image always \
                            corner-bot-qa
                    '''
                }
            }
            post {
                always { sh 'rm -f /tmp/corner-bot-qa-stack.yml || true' }
            }
        }

        stage('Deploy Produção') {
            when { branch 'main' }
            agent { label 'App-Mansão-Green' }
            steps {
                withCredentials([
                    string(credentialsId: 'corner-bet-username',    variable: 'CORNER_BET_USERNAME'),
                    string(credentialsId: 'corner-bet-password',    variable: 'CORNER_BET_PASSWORD'),
                    string(credentialsId: 'corner-bet-api-url',     variable: 'GAME_COMPACT_API_URL'),
                    string(credentialsId: 'corner-bet-api-token',   variable: 'GAME_COMPACT_API_TOKEN'),
                    string(credentialsId: 'corner-bet-sentry-dsn',  variable: 'SENTRY_DSN'),
                    string(credentialsId: 'corner-bet-tz',          variable: 'TZ'),
                    usernamePassword(
                        credentialsId: 'mg-docker-registry',
                        usernameVariable: 'REGISTRY_USER',
                        passwordVariable: 'REGISTRY_PASSWORD'
                    )
                ]) {
                    sh '''
                        printf '%s' "$REGISTRY_PASSWORD" | docker login ghcr.io --username "$REGISTRY_USER" --password-stdin
                        IMAGE_TAG=$(echo $GIT_COMMIT | cut -c1-7)
                        NETWORK_NAME=mansao-green-prod_web-net
                        export IMAGE_TAG NETWORK_NAME
                        envsubst < docker-compose.yml > /tmp/corner-bot-stack.yml
                        docker stack deploy \
                            --compose-file /tmp/corner-bot-stack.yml \
                            --with-registry-auth \
                            --resolve-image always \
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
            node('App-Mansão-Green') {
                sh 'docker logout ghcr.io || true'
                cleanWs()
            }
        }
    }
}