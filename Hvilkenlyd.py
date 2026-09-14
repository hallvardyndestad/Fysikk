import numpy as np
import json
import webbrowser
import os

# ============================================================
# GRUNNPARAMETRE
# ============================================================

fs = 44100
duration = 5.0

# Vinduer eleven kan velge
window_steps = [0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0]

# Starttid
start_steps = np.linspace(0, duration, 21).tolist()

t = np.linspace(0, duration, int(fs * duration), endpoint=False)


# ============================================================
# SIGNALER
# ============================================================

signals = []

# 1. Konstant amplitude og konstant frekvens
signals.append(
    0.6 * np.sin(2 * np.pi * 420 * t)
)

# 2. Økende amplitude
signals.append(
    (0.08 + 0.35 * t) * np.sin(2 * np.pi * 400 * t)
)

# 3. Minkende amplitude
signals.append(
    (0.65 - 0.11 * t) * np.sin(2 * np.pi * 300 * t)
)

# 4. Amplitudemodulasjon
signals.append(
    np.sin(2 * np.pi * 300 * t) *
    (0.15 + 0.85 * (0.5 + 0.5 * np.sin(2 * np.pi * 2 * t)))
)

# 5. Økende frekvens
# Frekvensen går omtrent fra 200 Hz til 950 Hz
phase_up = 2 * np.pi * (200 * t + 75 * t**2)
signals.append(
    0.6 * np.sin(phase_up)
)

# 6. Minkende frekvens
# Frekvensen går omtrent fra 700 Hz til 100 Hz
phase_down = 2 * np.pi * (700 * t - 60 * t**2)
signals.append(
    0.6 * np.sin(phase_down)
)

# 7. To toner samtidig
signals.append(
    0.6 * np.sin(2 * np.pi * 250 * t)
    + 0.35 * np.sin(2 * np.pi * 420 * t)
)

signals = [s.tolist() for s in signals]


# ============================================================
# BESKRIVELSER
# ============================================================

signal_info = [
    {
        "title": "Konstant amplitude og frekvens",
        "description": "Både amplituden og frekvensen er konstant.",
        "focus": "Se etter avstanden mellom toppene og høyden på signalet."
    },
    {
        "title": "Økende amplitude",
        "description": "Amplituden blir gradvis større.",
        "focus": "Se hvordan høyden på svingningene endrer seg."
    },
    {
        "title": "Minkende amplitude",
        "description": "Amplituden blir gradvis mindre.",
        "focus": "Se hvordan svingningene blir mindre."
    },
    {
        "title": "Amplituden varierer",
        "description": "Amplituden endrer seg periodisk, mens grunntonen er den samme.",
        "focus": "Se hvordan signalet vokser og avtar i høyde."
    },
    {
        "title": "Økende frekvens",
        "description": "Frekvensen øker med tiden.",
        "focus": "Se hvordan avstanden mellom svingningene blir mindre."
    },
    {
        "title": "Minkende frekvens",
        "description": "Frekvensen synker med tiden.",
        "focus": "Se hvordan avstanden mellom svingningene blir større."
    },
    {
        "title": "To toner samtidig",
        "description": "Signalet består av to forskjellige frekvenser samtidig.",
        "focus": "Zoom inn og se om du kan oppdage mer enn én svingning."
    }
]


# ============================================================
# DATA TIL JAVASCRIPT
# ============================================================

t_json = json.dumps(t.tolist())
signals_json = json.dumps(signals)
window_json = json.dumps(window_steps)
start_json = json.dumps(start_steps)
info_json = json.dumps(signal_info, ensure_ascii=False)


# ============================================================
# HTML
# ============================================================

html = f"""
<!DOCTYPE html>
<html lang="no">

<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Utforsk signaler</title>

<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>

<style>

* {{
    box-sizing: border-box;
}}

body {{
    margin: 0;
    background: #f5f7f8;
    color: #20272d;
    font-family: Arial, sans-serif;
}}

.container {{
    max-width: 1050px;
    margin: 0 auto;
    padding: 35px 25px 50px;
}}

.header {{
    margin-bottom: 25px;
}}

h1 {{
    margin: 0 0 8px;
    font-size: 30px;
    font-weight: 600;
}}

.intro {{
    margin: 0;
    color: #66727a;
    font-size: 16px;
}}

.card {{
    background: white;
    border-radius: 16px;
    padding: 25px;
    box-shadow: 0 3px 16px rgba(0,0,0,0.07);
}}

.toprow {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
}}

.signal-title {{
    font-size: 22px;
    font-weight: 600;
}}

.counter {{
    color: #66727a;
    font-size: 15px;
}}

.description {{
    background: #f1f4f5;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 20px;
    line-height: 1.5;
}}

.focus {{
    color: #52616a;
    margin-top: 5px;
}}

#plot {{
    width: 100%;
}}

.controls {{
    margin-top: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}}

.control {{
    background: #f7f8f9;
    border-radius: 10px;
    padding: 14px 16px;
}}

.control-label {{
    font-size: 14px;
    color: #66727a;
    margin-bottom: 6px;
}}

input[type=range] {{
    width: 100%;
}}

.value {{
    font-weight: 600;
    margin-top: 5px;
}}

.buttons {{
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 22px;
}}

button {{
    border: none;
    border-radius: 9px;
    padding: 11px 17px;
    font-size: 15px;
    cursor: pointer;
    background: #e8edef;
    color: #263238;
}}

button:hover {{
    background: #dce3e6;
}}

button.primary {{
    background: #334e5c;
    color: white;
}}

button.primary:hover {{
    background: #263d49;
}}

.sound-area {{
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid #e4e8ea;
}}

.sound-text {{
    color: #66727a;
    font-size: 14px;
    margin-bottom: 10px;
}}

.task {{
    margin-top: 30px;
    background: #f1f4f5;
    border-radius: 12px;
    padding: 18px;
}}

.task-title {{
    font-weight: 600;
    margin-bottom: 7px;
}}

.task p {{
    margin: 0;
    line-height: 1.5;
}}

@media (max-width: 700px) {{

    .container {{
        padding: 20px 12px 40px;
    }}

    .card {{
        padding: 17px;
    }}

    .controls {{
        grid-template-columns: 1fr;
    }}

    .toprow {{
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
    }}

}}

</style>
</head>


<body>

<div class="container">

    <div class="header">
        <h1>Utforsk signaler</h1>
        <p class="intro">
            Bruk grafen og lyden til å undersøke hvordan signaler kan være forskjellige.
        </p>
    </div>


    <div class="card">

        <div class="toprow">

            <div>
                <div class="signal-title" id="signalTitle"></div>
                <div class="counter">
                    Signal <span id="signalNumber">1</span> av 7
                </div>
            </div>

        </div>


        <div class="description">

            <div id="signalDescription"></div>

            <div class="focus">
                <strong>Se spesielt etter:</strong>
                <span id="signalFocus"></span>
            </div>

        </div>


        <div id="plot"></div>


        <div class="controls">

            <div class="control">

                <div class="control-label">
                    Hvor stort tidsvindu vil du se?
                </div>

                <input
                    type="range"
                    id="windowSlider"
                    min="0"
                    max="{len(window_steps)-1}"
                    value="0"
                    step="1"
                >

                <div class="value" id="windowValue"></div>

            </div>


            <div class="control">

                <div class="control-label">
                    Hvor i signalet vil du starte?
                </div>

                <input
                    type="range"
                    id="startSlider"
                    min="0"
                    max="{len(start_steps)-1}"
                    value="0"
                    step="1"
                >

                <div class="value" id="startValue"></div>

            </div>

        </div>


        <div class="buttons">

            <button onclick="previousSignal()">
                ◀ Forrige
            </button>

            <button class="primary" onclick="nextSignal()">
                Neste ▶
            </button>

        </div>


        <div class="sound-area">

            <div class="sound-text">
                Hør på signalet og sammenlign lyden med grafen.
            </div>

            <button class="primary" onclick="playSound()">
                ▶ Spill lyd
            </button>

            <button onclick="stopSound()">
                ■ Stopp
            </button>

        </div>


        <div class="task">

            <div class="task-title">
                Utforsk
            </div>

            <p id="taskText"></p>

        </div>

    </div>

</div>


<script>

// ============================================================
// DATA
// ============================================================

const fs = {fs};
const time = {t_json};
const signals = {signals_json};

const windowSteps = {window_json};
const startSteps = {start_json};

const signalInfo = {info_json};


// ============================================================
// TILSTAND
// ============================================================

let currentSignal = 0;
let windowIndex = 0;
let startIndex = 0;

let audioContext = null;
let audioSource = null;


// ============================================================
// ELEMENTER
// ============================================================

const plot = document.getElementById("plot");

const signalTitle = document.getElementById("signalTitle");
const signalNumber = document.getElementById("signalNumber");

const signalDescription =
    document.getElementById("signalDescription");

const signalFocus =
    document.getElementById("signalFocus");

const windowSlider =
    document.getElementById("windowSlider");

const startSlider =
    document.getElementById("startSlider");

const windowValue =
    document.getElementById("windowValue");

const startValue =
    document.getElementById("startValue");

const taskText =
    document.getElementById("taskText");


// ============================================================
// FINN GYLDIG STARTTID
// ============================================================

function getValidStart() {{

    const windowLength = windowSteps[windowIndex];

    let start = startSteps[startIndex];

    if (start + windowLength > {duration}) {{
        start = Math.max(0, {duration} - windowLength);
    }}

    return start;
}}


// ============================================================
// HENT UTSNITT
// ============================================================

function getSlice() {{

    const windowLength = windowSteps[windowIndex];

    const startTime = getValidStart();

    const startSample =
        Math.floor(startTime * fs);

    const numberSamples =
        Math.floor(windowLength * fs);

    return {{
        x: time.slice(
            startSample,
            startSample + numberSamples
        ),

        y: signals[currentSignal].slice(
            startSample,
            startSample + numberSamples
        ),

        xmin: startTime,

        xmax: startTime + windowLength
    }};
}}


// ============================================================
// OPPDATER TEKST
// ============================================================

function updateText() {{

    const info = signalInfo[currentSignal];

    signalTitle.innerText = info.title;

    signalNumber.innerText = currentSignal + 1;

    signalDescription.innerText =
        info.description;

    signalFocus.innerText =
        " " + info.focus;

    windowValue.innerText =
        windowSteps[windowIndex] + " s";

    startValue.innerText =
        getValidStart().toFixed(2) + " s";

    updateTask();
}}


// ============================================================
// OPPGAVE
// ============================================================

function updateTask() {{

    const tasks = [

        "Zoom inn og finn ut omtrent hvor lang tid én svingning tar.",

        "Sammenlign begynnelsen og slutten av signalet. Hva skjer med amplituden?",

        "Sammenlign begynnelsen og slutten av signalet. Hva skjer med amplituden?",

        "Finn et område der amplituden er stor og et område der den er liten.",

        "Flytt starttidspunktet gjennom signalet. Hvordan endrer avstanden mellom svingningene seg?",

        "Flytt starttidspunktet gjennom signalet. Hvordan endrer avstanden mellom svingningene seg?",

        "Zoom inn. Klarer du å finne tegn på at signalet består av mer enn én frekvens?"
    ];

    taskText.innerText = tasks[currentSignal];
}}


// ============================================================
// TEGN GRAF
// ============================================================

function drawPlot() {{

    const slice = getSlice();

    Plotly.react(
        plot,

        [{{
            x: slice.x,
            y: slice.y,
            mode: "lines",
            line: {{
                width: 1.5
            }}
        }}],

        {{
            height: 450,

            margin: {{
                l: 65,
                r: 25,
                t: 20,
                b: 55
            }},

            xaxis: {{
                title: "Tid (s)",
                range: [slice.xmin, slice.xmax]
            }},

            yaxis: {{
                title: "Amplitude",
                zeroline: true
            }},

            paper_bgcolor: "white",
            plot_bgcolor: "white",

            showlegend: false
        }},

        {{
            responsive: true,
            displaylogo: false,
            modeBarButtonsToRemove: [
                "lasso2d",
                "select2d"
            ]
        }}
    );

    updateText();
}}


// ============================================================
// SIGNALBYTTE
// ============================================================

function previousSignal() {{

    stopSound();

    currentSignal =
        (currentSignal + signals.length - 1)
        % signals.length;

    drawPlot();
}}


function nextSignal() {{

    stopSound();

    currentSignal =
        (currentSignal + 1)
        % signals.length;

    drawPlot();
}}


// ============================================================
// SLIDERE
// ============================================================

windowSlider.addEventListener(
    "input",
    function() {{

        windowIndex =
            Number(this.value);

        drawPlot();
    }}
);


startSlider.addEventListener(
    "input",
    function() {{

        startIndex =
            Number(this.value);

        drawPlot();
    }}
);


// ============================================================
// LYD
// ============================================================

function playSound() {{

    stopSound();

    audioContext =
        new (window.AudioContext ||
             window.webkitAudioContext)();

    const buffer =
        audioContext.createBuffer(
            1,
            signals[currentSignal].length,
            fs
        );

    buffer
        .getChannelData(0)
        .set(signals[currentSignal]);

    audioSource =
        audioContext.createBufferSource();

    audioSource.buffer = buffer;

    audioSource.connect(
        audioContext.destination
    );

    audioSource.start();
}}


function stopSound() {{

    if (audioSource !== null) {{

        try {{
            audioSource.stop();
        }} catch (e) {{}}

        audioSource.disconnect();
        audioSource = null;
    }}

    if (audioContext !== null) {{

        audioContext.close();
        audioContext = null;
    }}
}}


// ============================================================
// START
// ============================================================

drawPlot();

</script>

</body>
</html>
"""


# ============================================================
# LAGRE FIL
# ============================================================

filename = "utforsk_signaler.html"

with open(filename, "w", encoding="utf-8") as f:
    f.write(html)

print("Ferdig!")
print("HTML-filen er laget som:", filename)

# Åpne automatisk
webbrowser.open(
    "file://" + os.path.abspath(filename)
)