def docker_registry_hostname = "localhost:5000"

pipeline {
    agent any

    options {
        ansiColor('xterm')
    }

    environment {
        DOCKER_BRANCH_NAME = sh(script: "echo ${env.BRANCH_NAME} | sed 's#/#-#g'", returnStdout: true).trim()
        APP_NAME = "telegram-bot"
    }

    stages {
        stage('Build') {
            steps {
                echo 'Building'
                sh """
                    docker build -t $docker_registry_hostname/frontend/${env.APP_NAME}:${env.DOCKER_BRANCH_NAME} .
                    docker push $docker_registry_hostname/frontend/${env.APP_NAME}:${env.DOCKER_BRANCH_NAME}
                """
            }
            post {
                success {
                    slackSend(
                        channel: "#cn-front-alerts",
                        color: "good",
                        message: "`${env.APP_NAME}` is built successfully\n *Branch*: `${env.BRANCH_NAME}`\n *Link*: ${env.BUILD_URL}"
                    )
                }
                failure {
                    slackSend(
                        channel: "#cn-front-alerts",
                        color: "danger",
                        message: "`${env.APP_NAME}` build is failed\n *Branch*: `${env.BRANCH_NAME}`\n *Link*: ${env.BUILD_URL}"
                    )
                }
            }
        }
        stage('Test') {
            steps {
                echo 'Testing....'
            }
        }
    }
}
