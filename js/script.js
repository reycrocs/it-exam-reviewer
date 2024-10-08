let questions = [];
let selectedQuestions = [];
let timeLeft = 7200; // 2 hours in seconds
let timerInterval = null;

// Fetch and initialize exam
document.addEventListener('DOMContentLoaded', async () => {
  questions = await fetchQuestions();
  if (questions.length > 0) {
    initializeExam();
  } else {
    console.error('No questions found.');
  }
});

// Function to fetch and parse JSON file
async function fetchQuestions() {
  try {
    // Fetch JSON instead of CSV
    const response = await fetch('data/questions.json'); // Make sure the path to the JSON file is correct
    const data = await response.json(); // Parse the JSON directly
    return data; // This data is already in the form we need
  } catch (error) {
    console.error('Error fetching JSON:', error);
    return [];
  }
}

// Function to get a random selection of questions
function getRandomQuestions(questions, num) {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num); // Return only the first `num` questions
}

// Initialize the exam by selecting questions and restoring state
function initializeExam() {
  // Check if selected questions are stored in localStorage
  const savedQuestions = localStorage.getItem('selectedQuestions');
  if (savedQuestions) {
    selectedQuestions = JSON.parse(savedQuestions);
  } else {
    selectedQuestions = getRandomQuestions(questions, 2);
    localStorage.setItem('selectedQuestions', JSON.stringify(selectedQuestions));
  }

  displayAllQuestions(selectedQuestions);
  restoreState(); // Restore time and answers from localStorage
  startTimer();
  updateSubmitButtonState(); // Initially check if the submit button should be enabled
}

// Display the questions and answers
function displayAllQuestions(questions) {
  const container = document.getElementById('questions-container');
  container.innerHTML = ''; // Clear previous content

  questions.forEach((question, index) => {
    // Create question element with responsive padding and spacing
    const questionWrapper = document.createElement('div');
    questionWrapper.classList.add('bg-white', 'border', 'border-gray-300', 'p-4', 'md:p-10', 'rounded-lg', 'shadow-md', 'mb-6', 'text-center');
    questionWrapper.id = `question-${index}`; // Add an ID to each question

    const questionNumber = document.createElement('h2');
    questionNumber.textContent = `Question ${index + 1}:`;
    questionNumber.classList.add('text-lg', 'md:text-xl', 'font-bold', 'mb-4');

    const img = document.createElement('img');
    img.src = `assets/images/${question.img}`; // Path to your images should be correctly referenced
    img.alt = `Question ${index + 1}`;
    img.classList.add('mx-auto', 'my-5', 'w-full'); // Responsive image

    const correctAnswerDisplay = document.createElement('div');
    correctAnswerDisplay.id = `correct-answer-${index}`;
    correctAnswerDisplay.classList.add('mb-4', 'text-lg', 'font-bold', 'hidden');

    const optionsWrapper = document.createElement('div');
    optionsWrapper.classList.add('flex', 'justify-center', 'space-x-6'); // Always horizontal layout

    ['a', 'b', 'c', 'd'].forEach(option => {
      const optionLabel = document.createElement('label');
      optionLabel.classList.add('inline-flex', 'items-center', 'space-x-2', 'text-lg', 'md:text-2xl'); // Responsive text size

      const optionInput = document.createElement('input');
      optionInput.type = 'radio';
      optionInput.name = `question-${index}`; // Group by question index
      optionInput.value = option.toLowerCase(); // Store option in lowercase
      optionInput.classList.add('mr-2', 'h-6', 'w-6', 'md:h-8', 'md:w-8'); // Responsive radio buttons

      // Restore checked state if available
      const savedAnswers = JSON.parse(localStorage.getItem('answers')) || {};
      if (savedAnswers[index] === option.toLowerCase()) {
        optionInput.checked = true;
      }

      optionInput.addEventListener('change', () => {
        updateSubmitButtonState(); // Check if all questions are answered
        saveAnswer(index, option.toLowerCase()); // Save user's answer in localStorage
      });

      optionLabel.appendChild(optionInput);
      optionLabel.appendChild(document.createTextNode(`${option.toUpperCase()}`)); // Display option in uppercase

      optionsWrapper.appendChild(optionLabel);
    });

    questionWrapper.appendChild(questionNumber); // Add question number
    questionWrapper.appendChild(img); // Add image
    questionWrapper.appendChild(correctAnswerDisplay); // Add correct answer display element
    questionWrapper.appendChild(optionsWrapper); // Add options
    container.appendChild(questionWrapper);
  });
}

// Start the timer based on the start time stored in localStorage
function startTimer() {
  const timerElement = document.getElementById('timer');

  // Check if the start time is already saved in localStorage
  let startTime = localStorage.getItem('startTime');

  // If there's no start time in localStorage, set it to the current time
  if (!startTime) {
    startTime = new Date().getTime(); // Current timestamp in milliseconds
    localStorage.setItem('startTime', startTime); // Save the start time in localStorage
  } else {
    startTime = parseInt(startTime, 10); // Parse the saved start time
  }

  // Calculate the total time for the exam (2 hours in seconds)
  const totalExamTime = 7200; // 2 hours in seconds (7200)

  timerInterval = setInterval(() => {
    const currentTime = new Date().getTime(); // Current timestamp in milliseconds
    const elapsedTime = Math.floor((currentTime - startTime) / 1000); // Elapsed time in seconds

    // Calculate the remaining time
    const timeLeft = totalExamTime - elapsedTime;

    // If time is up, grade the exam
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      gradeExam();
    } else {
      // Calculate hours, minutes, and seconds
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      const seconds = timeLeft % 60;

      // Update the timer display (hours:minutes:seconds)
      timerElement.textContent = `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
  }, 1000);
}

// Reset the timer and clear localStorage when the exam is exited or restarted
function exitExam() {
  // Show the custom confirmation dialog
  document.getElementById('exitModal').classList.remove('hidden');
}

// Function to handle user's choice in the modal
function handleExitChoice(choice) {
  if (choice === 'yes') {
    // Clear all relevant data from localStorage
    localStorage.removeItem('answers');
    localStorage.removeItem('timeLeft');
    localStorage.removeItem('selectedQuestions');
    localStorage.removeItem('startTime'); // Clear the saved start time

    // Redirect to the home page
    window.location.href = 'https://reycrocs.github.io/it-exam-reviewer/';
  } else {
    // Hide the modal if user chooses 'No'
    document.getElementById('exitModal').classList.add('hidden');
  }
}

// Save user answer in localStorage
function saveAnswer(questionIndex, answer) {
  const answers = JSON.parse(localStorage.getItem('answers')) || {};
  answers[questionIndex] = answer;
  localStorage.setItem('answers', JSON.stringify(answers));
}

// Restore user answers and time from localStorage
function restoreState() {
  // Restore user answers
  const savedAnswers = JSON.parse(localStorage.getItem('answers')) || {};
  Object.keys(savedAnswers).forEach(index => {
    const savedAnswer = savedAnswers[index];
    const input = document.querySelector(`input[name="question-${index}"][value="${savedAnswer}"]`);
    if (input) {
      input.checked = true; // Restore checked answer
    }
  });

  // Restore timer
  const savedTime = localStorage.getItem('timeLeft');
  if (savedTime) {
    timeLeft = parseInt(savedTime, 10);
  }
}

// Update the state of the Submit button based on answers
function updateSubmitButtonState() {
  const submitButton = document.querySelector('button[onclick="gradeExam()"]');
  const allAnswered = checkAllQuestionsAnswered();

  if (allAnswered) {
    console.log('All questions answered.');
    // Optionally, you can highlight the Submit button or provide visual feedback
  } else {
    console.log('Not all questions are answered.');
    // Optionally, provide visual feedback that not all questions are answered
  }
}

// Check if all questions have been answered
function checkAllQuestionsAnswered() {
  const totalQuestions = selectedQuestions.length;
  for (let i = 0; i < totalQuestions; i++) {
    const selectedOption = document.querySelector(`input[name="question-${i}"]:checked`);
    if (!selectedOption) {
      console.log(`Question ${i + 1} is unanswered`);
      return false; // If any question is unanswered, return false
    }
  }
  return true; // All questions are answered
}

// Grade the exam
function gradeExam() {
  const allAnswered = checkAllQuestionsAnswered();
  if (!allAnswered) {
    scrollToFirstUnansweredQuestion(); // Scroll to the first unanswered question
    return; // Prevent the exam from being graded if not all questions are answered
  }

  clearInterval(timerInterval); // Stop the timer

  // Calculate Time Taken
  const startTime = parseInt(localStorage.getItem('startTime'), 10); // Retrieve the start time
  const currentTime = new Date().getTime(); // Get the current time
  const elapsedTime = Math.floor((currentTime - startTime) / 1000); // Time taken in seconds
  const timeTaken = formatTimeTaken(elapsedTime); // Format the elapsed time

  // Clear localStorage
  localStorage.removeItem('answers');
  localStorage.removeItem('timeLeft');
  localStorage.removeItem('selectedQuestions');
  localStorage.removeItem('startTime');

  const container = document.getElementById('questions-container');
  const questionWrappers = container.querySelectorAll('div.border'); // Target each question wrapper
  let correctAnswersCount = 0;

  questionWrappers.forEach((questionWrapper, index) => {
    const selectedOption = questionWrapper.querySelector('input[type="radio"]:checked');
    const correctAnswer = selectedQuestions[index].answer;

    const correctAnswerDisplay = document.getElementById(`correct-answer-${index}`);
    correctAnswerDisplay.classList.remove('hidden'); // Show the correct answer section

    if (selectedOption) {
      const selectedAnswer = selectedOption.value.toLowerCase(); // Ensure the selected answer is lowercase
      if (selectedAnswer === correctAnswer) {
        correctAnswerDisplay.textContent = 'Correct'; // Show "Correct"
        correctAnswerDisplay.classList.add('text-green-500');
        correctAnswersCount++; // Increment score for correct answer
      } else {
        correctAnswerDisplay.textContent = `Wrong - The correct answer is ${correctAnswer.toUpperCase()}`; // Show correct answer if wrong
        correctAnswerDisplay.classList.add('text-red-500');
      }
    } else {
      correctAnswerDisplay.textContent = `You did not answer - The correct answer is ${correctAnswer.toUpperCase()}`;
      correctAnswerDisplay.classList.add('text-red-500');
    }
  });

  // Show score and time taken in the result container
  const timerElement = document.getElementById('timeTaken');
  const scoreElement = document.getElementById('score');

  timerElement.textContent = `${timeTaken}`; // Update the time taken display
  scoreElement.textContent = `${correctAnswersCount}/100`; // Update the score display

  // Make the score and time display visible
  const resultContainer = document.getElementById('resultContainer');
  resultContainer.classList.remove('hidden'); // Remove the 'hidden' class to show the result section

  // Show a custom modal with the score and time taken
  showResultModal(correctAnswersCount, timeTaken);

  // Update the submit button to "Start Again"
  const submitButton = document.querySelector('button[onclick="gradeExam()"]');
  submitButton.textContent = 'Start Again';
  submitButton.onclick = () => location.reload(); // Reload the page to restart
}

// Function to show a custom result modal with Tailwind CSS
function showResultModal(score, timeTaken) {
  const modal = document.getElementById('resultModal');
  const modalScore = document.getElementById('modalScore');
  const modalTime = document.getElementById('modalTime');

  modalScore.textContent = `You scored ${score} out of 100`;
  modalTime.textContent = `Time Taken: ${timeTaken}`;

  modal.classList.remove('hidden');
}


// Function to format time taken (from seconds to hours and minutes)
function formatTimeTaken(elapsedTime) {
  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Math.floor((elapsedTime % 3600) / 60);
  
  let timeTakenString = '';
  
  if (hours > 0) {
    timeTakenString += `${hours} hr${hours > 1 ? 's' : ''} `;
  }
  
  if (minutes > 0) {
    timeTakenString += `${minutes} min${minutes > 1 ? 's' : ''}`;
  }
  
  return timeTakenString.trim();
}


// Scroll to the first unanswered question
function scrollToFirstUnansweredQuestion() {
  const totalQuestions = selectedQuestions.length;
  for (let i = 0; i < totalQuestions; i++) {
    const selectedOption = document.querySelector(`input[name="question-${i}"]:checked`);
    if (!selectedOption) {
      const questionWrapper = document.getElementById(`question-${i}`);
      if (questionWrapper) {
        console.log(`Found question wrapper for Question ${i + 1}`);
        console.log(`Scrolling to question ${i + 1}`);
        questionWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Show the custom alert for unanswered question
        showUnansweredQuestionAlert(i + 1);
      } else {
        console.error(`Question wrapper for Question ${i + 1} not found.`);
      }
      break; // Stop once we find the first unanswered question
    }
  }
}

// Function to display the custom alert for unanswered question
function showUnansweredQuestionAlert(questionNumber) {
  const alertBox = document.getElementById('unansweredAlert');
  alertBox.textContent = `Please answer Question ${questionNumber}`;
  alertBox.classList.remove('hidden');

  // Automatically hide the alert after 3 seconds
  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 3000);
}

// Function to scroll to the top of the page
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // Smooth scrolling
  });

  // Optionally, you can also close the result modal after scrolling
  document.getElementById('resultModal').classList.add('hidden');
}
