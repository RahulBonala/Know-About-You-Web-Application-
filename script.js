// State Management
const state = {
    currentUser: {},
    apiLoading: false
};

// DOM Elements
const views = {
    landing: document.getElementById('landing-page'),
    loginPrank: document.getElementById('login-prank'),
    terms: document.getElementById('terms-view'),
    form: document.getElementById('input-form-view')
    // Loading & Results are now INSIDE the form view
};

const elements = {
    loading: document.getElementById('loading-view'),
    results: document.getElementById('results-view'),
    loadingText: document.getElementById('loading-text'),
    resultsGrid: document.getElementById('results-grid')
};

const buttons = {
    login: document.getElementById('btn-login'),
    getStarted: document.getElementById('btn-get-started'),
    submitTerms: document.getElementById('btn-submit-terms'),
    reset: document.getElementById('btn-reset')
};

const forms = {
    bio: document.getElementById('bio-form'),
    termsCheck: document.getElementById('terms-check')
};

// API Configuration
const API_KEY = 'AIzaSyAOD6cjx3Ebi0yLaBPnqaf5SFQv-UZ1tpM';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

// --- Navigation Logic ---

function showView(viewName) {
    // Hide all main views
    Object.values(views).forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });

    // Show target view
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
        setTimeout(() => {
            views[viewName].classList.add('active');
        }, 10);
    }
}

// --- Event Listeners ---

// 1. Landing Page Interactions
buttons.login.addEventListener('click', () => {
    showView('loginPrank');

    // Auto redirect back after 3 seconds
    setTimeout(() => {
        showView('landing');
    }, 3000);
});

buttons.getStarted.addEventListener('click', () => {
    showView('terms');
});

// 2. Terms Logic
forms.termsCheck.addEventListener('change', (e) => {
    buttons.submitTerms.disabled = !e.target.checked;
});

buttons.submitTerms.addEventListener('click', () => {
    showView('form');
});

// 3. Form Handling
forms.bio.addEventListener('submit', (e) => {
    e.preventDefault();

    // Capture Data
    state.currentUser = {
        name: document.getElementById('full-name').value,
        dob: document.getElementById('dob').value,
        tob: document.getElementById('tob').value,
        pob: document.getElementById('pob').value
    };

    // Construct Prompt
    const prompt = `
    You are an expert life analyst. You must analyze the following user data:
    Name: ${state.currentUser.name}
    Date of Birth: ${state.currentUser.dob}
    Time of Birth: ${state.currentUser.tob}
    Place of Birth: ${state.currentUser.pob}

    You must return a raw JSON object (no markdown formatting) containing the following 7 sections as keys:
    1. Life Timeline: Based on the birthdate, map out likely life milestones. Keep it data-driven and realistic.
    2. Strengths & Weakness: Analyze personality traits. Show natural strengths and common weaknesses.
    3. Career Patterns: Suggest 5 career paths where people with similar backgrounds statistically thrive and why.
    4. Decision Pattern: Predict how someone born on this date usually makes big life decisions (logical, emotional, or impulsive?).
    5. Relationship Dynamics: Outline common communication styles and relationship patterns.
    6. Energy Map: Map seasonal or monthly productivity patterns.
    7. Life Learnings: Summarize 3 key life lessons.

    Format the JSON strictly like this:
    {
        "life_timeline": "text...",
        "strengths_weaknesses": "text...",
        "career_patterns": "text...",
        "decision_pattern": "text...",
        "relationship_dynamics": "text...",
        "energy_map": "text...",
        "life_learnings": "text..."
    }
    `;

    // Start Analysis
    runAnalysis(prompt);
});

buttons.reset.addEventListener('click', () => {
    // Clear State
    state.currentUser = {};
    forms.bio.reset();
    forms.termsCheck.checked = false;
    buttons.submitTerms.disabled = true;
    elements.resultsGrid.innerHTML = '';

    // Hide results & loading, go back to landing
    elements.results.classList.add('hidden');
    elements.loading.classList.add('hidden');
    showView('landing');
});

// --- Core Logic ---

async function runAnalysis(prompt) {
    // Show loading INSIDE the current view (below form)
    elements.loading.classList.remove('hidden');
    elements.results.classList.add('hidden'); // Hide valid results if any

    // Scroll to loading
    elements.loading.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Cycle loading messages
    const messages = [
        "Parsing birth coordinates...",
        "Running Gemini Generative AI protocols...",
        "Searching for statistical anomalies...",
        "Pretending to do complex math...",
        "Finalizing report..."
    ];

    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        elements.loadingText.textContent = messages[msgIndex];
        msgIndex = (msgIndex + 1) % messages.length;
    }, 800);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        clearInterval(msgInterval);

        if (data.error) {
            throw new Error(data.error.message);
        }

        const rawText = data.candidates[0].content.parts[0].text;

        // Clean markdown code blocks if present to parse JSON
        let jsonString = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }
        const parsedData = JSON.parse(jsonString);

        renderResults(parsedData);

        // Switch visibility
        elements.loading.classList.add('hidden');
        elements.results.classList.remove('hidden');

        // Scroll to results
        setTimeout(() => {
            elements.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } catch (error) {
        clearInterval(msgInterval);
        console.error("Analysis Failed:", error);
        alert("Analysis failed. The stars are silent today (or the API key is invalid). Check console.");
        elements.loading.classList.add('hidden');
    }
}

function renderResults(data) {
    elements.resultsGrid.innerHTML = '';

    const titles = {
        life_timeline: "Life Timeline",
        strengths_weaknesses: "Strengths & Weaknesses",
        career_patterns: "Career Patterns",
        decision_pattern: "Decision Making Style",
        relationship_dynamics: "Relationship Dynamics",
        energy_map: "Energy Productivity Map",
        life_learnings: "Key Life Learnings"
    };

    // Helper to format text into lists or paragraphs
    const formatContent = (text) => {
        if (text.includes('- ') || text.includes('1. ')) {
            // Very basic list conversion
            return '<ul>' + text.split('\n').filter(line => line.trim().length > 0).map(line => `<li>${line.replace(/^- |^\d+\. /, '')}</li>`).join('') + '</ul>';
        }
        return `<p>${text}</p>`;
    };

    Object.keys(titles).forEach(key => {
        if (data[key]) {
            const card = document.createElement('div');
            card.className = 'result-card';

            // simple check if it is an array or string
            let contentHtml = '';
            if (typeof data[key] === 'string') {
                contentHtml = formatContent(data[key]);
            } else if (Array.isArray(data[key])) {
                contentHtml = '<ul>' + data[key].map(item => `<li>${item}</li>`).join('') + '</ul>';
            } else {
                contentHtml = `<p>${JSON.stringify(data[key])}</p>`;
            }

            card.innerHTML = `
                <h3>${titles[key]}</h3>
                <div class="card-content">${contentHtml}</div>
            `;
            elements.resultsGrid.appendChild(card);
        }
    });
}
