// Function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to get random samples
function getRandomSamples(data, numSamples) {
    let allKeys = Object.keys(data);
    shuffleArray(allKeys);
    let selectedKeys = allKeys.slice(0, numSamples);
    let selectedSamples = {};
    selectedKeys.forEach(key => {
        selectedSamples[key] = data[key];
    });
    return selectedSamples;
}

// Function for sending data to server
function sendDataToServer(sender, options) {
    options.showDataSaving();
    
    let organizedData = {};
    const answers = sender.data;
    
    Object.keys(answers).forEach(key => {
        if (key.includes('_model')) {
            const [testId, model, metric] = key.split('_');
            if (!organizedData[testId]) {
                organizedData[testId] = {};
            }
            if (!organizedData[testId][model]) {
                organizedData[testId][model] = {};
            }
            organizedData[testId][model][metric] = answers[key];
        }
    });
    
    let dataJSON = {
        testResults: organizedData,
        feedback: answers.feedback,
        selected_tests: sender.data.selected_tests,
        timestamp: new Date().toISOString()
    };
    
    $.ajax({
        type: "POST",
        url: "/postmethod",
        contentType: "application/json",
        data: JSON.stringify(dataJSON),
        dataType: "json",
        success: function(response) {
            console.log(response);
            options.showDataSavingSuccess();
        },
        error: function(err) {  
            console.log(err);
            options.showDataSavingError();
        }
    });
}

// Apply SurveyJS styling with custom colors
var defaultThemeColors = Survey.StylesManager.ThemeColors["default"];
defaultThemeColors["$main-color"] = "#18375f";
defaultThemeColors["$main-hover-color"] = "#0f2847";
defaultThemeColors["$header-background-color"] = "#e7e7e7";
defaultThemeColors["$answer-background-color"] = "#f8f8f8";
defaultThemeColors["$text-color"] = "#1f1f1f";

Survey.StylesManager.applyTheme();

// Add custom CSS
document.head.insertAdjacentHTML('beforeend', `
<style>
.sv-panel {
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.sv-panel__title {
    background-color: #e7e7e7;
    color: #333;
    padding: 10px 15px;
    font-weight: bold;
}
.model-response {
    background-color: white;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin: 10px 0;
}
.sv-rating {
    margin: 15px 0;
}
.sv-rating__item {
    background-color: #fff;
    border: 1px solid #ccc;
}
.sv-rating__item--selected {
    background-color: #18375f;
    color: white;
}
</style>
`);

// Define main survey structure
var defsurveyJSON = {
    title: "Αξιολόγηση Απαντήσεων Διαλόγου",
    description: "Δοκιμή για την αξιολόγηση της ποιότητας των απαντήσεων διαλόγου από διαφορετικά μοντέλα",
    pages: [
        {
            name: "Intro",
            elements: [
                {
                    type: "html",
                    name: "Info",
                    html: "<p>Αυτή η έρευνα παρουσιάζει διαλόγους και απαντήσεις από διαφορετικά μοντέλα AI. Για κάθε δοκιμή, θα:</p>" +
                          "<ul>" +
                          "<li>Θα σας δίνετε ένας δίαλογος και 4 διαφορετικές απαντήσεις, μία για κάθε μοντέλο ως συνέχεια του διαλόγου που θα διαβάσετε.</li>" +
                          "<li>Αξιολογήσετε 4 διαφορετικές απαντήσεις μοντέλων.</li>" +
                          "<li>Βαθμολογήσετε κάθε απάντηση για:</li>" +
                          "<ul>" +
                          "<li>Fluency/Ρευστότητα (πόσο φυσική και γραμματικά σωστή είναι η απάντηση)</li>" +
                          "<li>Coherence/Συνοχή (πόσο καλά ταιριάζει με το προηγούμενο πλαίσιο διαλόγου)</li>" +
                          "</ul></ul>" +
                          "<br><p><strong>Εκτιμώμενη διάρκεια:</strong> 10-15 λεπτά</p>"
                }
            ],
            title: "Πληροφορίες Έρευνας"
        }
    ],
    showProgressBar: "bottom",
    showQuestionNumbers: "onPage"
};

// Function to format dialogue turns into HTML
function formatDialogue(dialogue) {
    let html = '<div class="dialogue-context"><h4>Διάλογος:</h4>';
    dialogue.forEach(turn => {
        html += `<p><strong>${turn.speaker}:</strong> ${turn.text}</p>`;
    });
    html += '</div>';
    return html;
}

// Template for rating element
function createRatingElement(name, title) {
    return {
        type: "rating",
        name: name,
        title: title,
        isRequired: true,
        rateMin: 1,
        rateMax: 5,
        rateStep: 1,
        minRateDescription: "Κακή",
        maxRateDescription: "Εξαιρετική"
    };
}

// Template for model panel
function createModelPanel(modelNum) {
    return {
        type: "panel",
        name: `model${modelNum}_panel`,
        title: `Assistant Model ${modelNum} Response`,
        elements: [
            {
                type: "html",
                name: `model${modelNum}_response`,
                html: "Response will be inserted here"
            },
            createRatingElement(`model${modelNum}_fluency`, "Ρευστότητα"),
            createRatingElement(`model${modelNum}_coherence`, "Συνοχή")
        ]
    };
}

// Define test page template
var defTestPage = {
    name: "Test",
    elements: [
        {
            type: "html",
            name: "dialogue",
            html: "Dialogue context will be inserted here"
        },
        createModelPanel(1),
        createModelPanel(2),
        createModelPanel(3),
        createModelPanel(4)
    ]
};

// Function to create a test page from dialogue data
function createTestPage(testData, testNumber, originalTestId) {
    let testPage = JSON.parse(JSON.stringify(defTestPage));
    testPage.name = `Δοκιμή ${testNumber}`;
    testPage.title = `Δοκιμή ${testNumber}`;

    testPage.elements[0].html = formatDialogue(testData.dialogue);

    const modelMap = {
        'model1': 'GPT2-GREEK-NV',
        'model2': 'XGLM-P-MTL',
        'model3': 'XGLM-NV',
        'model4': 'Meltemi'
    };

    Object.entries(modelMap).forEach(([genericName, actualName], index) => {
        testPage.elements[index + 1].elements[0].html = `<div class="model-response">${testData[actualName]}</div>`;
        testPage.elements[index + 1].elements[1].name = `${originalTestId}_${genericName}_fluency`;
        testPage.elements[index + 1].elements[2].name = `${originalTestId}_${genericName}_coherence`;
    });

    return testPage;
}

// Load dialogue data and initialize survey
$.getJSON('static/js/dialogue_data.json', function(data) {
    const selectedData = getRandomSamples(data, 3);
    let surveyJSON = JSON.parse(JSON.stringify(defsurveyJSON));
    let selectedTestIds = [];
    
    Object.entries(selectedData).forEach(([originalTestId, testData], index) => {
        const testPage = createTestPage(testData, index + 1, originalTestId);
        surveyJSON.pages.splice(index + 1, 0, testPage);
        selectedTestIds.push(originalTestId);
    });

    surveyJSON.pages.push({
        name: "Feedback",
        elements: [{
            type: "comment",
            name: "feedback",
            title: "Θα χαρούμε να λάβουμε τα σχόλιά σας (προαιρετικό)"
        }],
        title: "Σχόλια"
    });

    var survey = new Survey.Model(surveyJSON);
    survey.data.selected_tests = selectedTestIds;
    
    $("#surveyContainer").Survey({
        model: survey,
        onComplete: sendDataToServer
    });
});