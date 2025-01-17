let questions = [];
        let currentQuestion = 0;
        let score = 0;
        let startTime;

        function generateQuestion() {
            const operations = ['+', '-', '*', '/'];
            const operation = operations[Math.floor(Math.random() * operations.length)];
            let num1, num2;

            switch (operation) {
                case '+':
                    num1 = Math.floor(Math.random() * 100);
                    num2 = Math.floor(Math.random() * 100);
                    break;
                case '-':
                    num1 = Math.floor(Math.random() * 100);
                    num2 = Math.floor(Math.random() * 100);
                    if (num1 < num2) {
                        [num1, num2] = [num2, num1];
                    }
                    break;
                case '*':
                    num1 = Math.floor(Math.random() * 100);
                    num2 = Math.floor(Math.random() * 10);
                    if (Math.random() > 0.5) {
                        [num1, num2] = [num2, num1];
                    }
                    break;
                case '/':
                    num2 = Math.floor(Math.random() * 99) + 1;
                    num1 = num2 * Math.floor(Math.random() * 10);
                    break;
            }

            return {
                question: `${num1} ${operation} ${num2}`,
                answer: eval(`${num1} ${operation} ${num2}`)
            };
        }

        function startGame() {
            const questionCount = document.getElementById('questionCount').value;
            questions = [];
            for (let i = 0; i < questionCount; i++) {
                questions.push(generateQuestion());
            }
            currentQuestion = 0;
            score = 0;
            startTime = new Date();
            document.getElementById('game').classList.remove('hidden');
            document.getElementById('results').classList.add('hidden');
            showQuestion();
        }

        function showQuestion() {
            if (currentQuestion < questions.length) {
                document.getElementById('questionBox').innerText = questions[currentQuestion].question;
            } else {
                endGame();
            }
        }

        function checkAnswer() {
            const answerInput = document.getElementById('answerInput');
            const userAnswer = parseFloat(answerInput.value);
            if (userAnswer === questions[currentQuestion].answer) {
                score++;
            }
            currentQuestion++;
            answerInput.value = '';
            showQuestion();
        }

        function endGame() {
            const endTime = new Date();
            const totalTime = (endTime - startTime) / 1000;
            const averageTime = score === 0 ? -1 : totalTime / score;
            document.getElementById('score').innerText = score;
            document.getElementById('totalQuestions').innerText = questions.length;
            document.getElementById('totalTime').innerText = totalTime.toFixed(2);
            document.getElementById('averageTime').innerText = averageTime.toFixed(2);
            document.getElementById('game').classList.add('hidden');
            document.getElementById('results').classList.remove('hidden');
        }