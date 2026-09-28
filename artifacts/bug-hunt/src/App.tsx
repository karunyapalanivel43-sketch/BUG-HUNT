import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Keyboard,
  RotateCcw,
  Terminal,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

type LevelId = 'easy' | 'mid' | 'hard';
type Screen = 'home' | 'how' | 'levels' | 'game' | 'complete' | 'result';
type AgentState = 'idle' | 'thinking' | 'inspecting' | 'correct' | 'wrong' | 'warning' | 'complete' | 'result';
type Question = {
  id: number;
  code: string;
  suspicious: number;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  points: number;
};

const question = (
  id: number,
  code: string,
  suspicious: number,
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
  points: number,
): Question => ({ id, code, suspicious, prompt, options, answer, explanation, points });

const QUESTIONS: Record<LevelId, Question[]> = {
  easy: [
    question(1, `name = "Ada"\nprint("Hello, " + name)`, 2, 'What is wrong with this snippet?', ['The variable is not declared', 'Nothing — it runs correctly', 'print needs square brackets', 'Strings cannot be joined'], 1, 'Both strings are valid and the concatenation is legal Python.', 100),
    question(2, `score = 78\nif score > 60\n    print("pass")`, 1, 'Which fix makes this condition valid?', ['Add a colon after 60', 'Indent the if line', 'Use one equals sign', 'Wrap score in quotes'], 0, 'Python blocks begin with a colon after the condition.', 100),
    question(3, `items = ["map", "key", "lamp"]\nprint(items[3])`, 1, 'Why does the highlighted line fail?', ['Lists start at index 1', 'The list is immutable', 'Index 3 is out of range', 'print cannot show lists'], 2, 'The last valid index is 2 because Python starts counting at zero.', 100),
    question(4, `for item in ["red", "blue"]\n    print(item)`, 1, 'Which character is missing?', ['A comma', 'A colon', 'A semicolon', 'A closing bracket'], 1, 'A for statement needs a colon before its indented body.', 100),
    question(5, `def greet(name):\nprint("Hi " + name)\ngreet("Mina")`, 1, 'What is the bug in this function?', ['name should be a number', 'The call is inside the function', 'The body needs indentation', 'def must be uppercase'], 2, 'The print statement belongs to the function body and must be indented.', 100),
    question(6, `numbers = [2, 4, 6]\nfor n in numbers:\n  total = n`, 2, 'Why is total not a running total?', ['n is not a number', 'total is replaced each loop', 'for cannot use lists', 'total needs quotes'], 1, 'Assigning total each time overwrites the previous value; start at zero and add.', 100),
    question(7, `is_open = True\nif is_open = True:\n    print("scan")`, 1, 'Which operator belongs in the if check?', ['+=', '==', '=>', '!='], 1, 'A single equals assigns. Double equals compares two values.', 100),
    question(8, `target = "bug"\nprint(target.upper)`, 1, 'What should change to call the string method?', ['Use target.upper()', 'Use target.UPPER', 'Remove target', 'Add a colon'], 0, 'upper is a method, so parentheses invoke it.', 100),
    question(9, `count = 0\nwhile count < 3:\n    print(count)`, 2, 'What will happen when this runs?', ['It prints 0, 1, 2', 'It prints 1, 2, 3', 'It loops forever', 'It cannot print integers'], 2, 'count never changes, so the condition remains true forever.', 100),
    question(10, `def add(a, b):\n    return a + b\nresult = add(4)`, 3, 'How should the function call be fixed?', ['add(4, 0)', 'add(4, 4)', 'add(a=4)', 'Remove return'], 0, 'The function requires two arguments; supplying a default value completes the call.', 100),
  ],
  mid: [
    question(11, `temperature = 18\nif temperature > 20:\n    mood = "warm"\nelse\n    mood = "cool"`, 4, 'Which syntax fix is needed?', ['Colon after else', 'Colon after mood', 'else needs parentheses', 'Use elif instead'], 0, 'else introduces a block and must end with a colon.', 125),
    question(12, `def first(items):\n    return items[1]\nprint(first(["a", "b", "c"]))`, 1, 'The hunter wants the first item. What should the return line use?', ['items[0]', 'items[1]', 'items.first()', 'items[-0]'], 0, 'Index zero is the first position in a Python list.', 125),
    question(13, `for i in range(1, 4):\n    print(i)\n# expected: 0, 1, 2`, 1, 'Which range produces the expected output?', ['range(1, 4)', 'range(0, 3)', 'range(0, 2)', 'range(1, 3)'], 1, 'The stop value is exclusive, so range(0, 3) gives 0, 1, 2.', 125),
    question(14, `user = {"name": "Kiro"}\nprint(user["role"])`, 1, 'What kind of issue can this line raise?', ['TypeError', 'KeyError', 'IndexError', 'NameError'], 1, 'The dictionary has no role key, so looking it up raises KeyError.', 125),
    question(15, `def is_even(value):\n    if value % 2 = 0:\n        return True\n    return False`, 2, 'Find the invalid operator.', ['%', '=', '==', 'return'], 1, 'Use == to compare the remainder with zero; = is assignment.', 125),
    question(16, `items = ["a", "b", "c"]\nfor index in range(len(items)):\n    print(items[index + 1])`, 3, 'How can the loop avoid its final out-of-range access?', ['Use index - 1', 'Use range(len(items) - 1)', 'Use len(items) + 1', 'Use items[index] twice'], 1, 'The current range includes the last index, so stopping one step earlier avoids index + 1 overflow.', 125),
    question(17, `active = False\nif not active:\n    print("offline")\nelse:\n    print("online")`, 1, 'What does this program print?', ['offline', 'online', 'True', 'Nothing'], 0, 'not False evaluates to True, so the first branch runs.', 125),
    question(18, `logs = ["ok", "warn"]\nlogs.append["error"]`, 1, 'How should error be appended?', ['logs.append("error")', 'logs.add("error")', 'append.logs("error")', 'logs += ("error")'], 0, 'append is a list method and needs parentheses when called.', 125),
    question(19, `value = 5\nif value > 3:\nprint("large")`, 2, 'What indentation repair is required?', ['Indent print one level', 'Indent the if line', 'Indent value', 'No repair'], 0, 'Statements inside a conditional block must be indented.', 125),
    question(20, `try:\n    result = 10 / 0\nexcept ValueError:\n    result = 0`, 3, 'Which exception should be caught?', ['ValueError', 'ZeroDivisionError', 'IndexError', 'SyntaxError'], 1, 'Division by zero raises ZeroDivisionError, not ValueError.', 125),
  ],
  hard: [
    question(21, `def find_bug(items, target):\n    for item in items:\n        if item == target:\n            return True\n    return False`, 3, 'What is the control flow doing correctly?', ['Returning on the first match', 'Skipping every match', 'Comparing indexes to text', 'Returning before the loop'], 0, 'The early return is safe here: it exits only when a matching item is found.', 150),
    question(22, `config = {"debug": False}\nif config.get("trace"):\n    print("trace on")\nprint("done")`, 1, 'What happens if trace is missing?', ['A KeyError occurs', 'It prints trace on', 'It skips the block and prints done', 'The program stops at get'], 2, 'dict.get returns None for a missing key, which is falsey.', 150),
    question(23, `values = [1, 2, 3, 4]\nresult = [v * 2 for v in values if v % 2 = 0]`, 2, 'Which edit makes this comprehension valid?', ['Change = to ==', 'Change % to //', 'Remove if', 'Use braces around values'], 0, 'The filter compares each remainder, so it needs the equality operator.', 150),
    question(24, `def counter():\n    count = 0\n    count += 1\n    return count\nprint(counter(), counter())`, 4, 'Why does this print the same number twice?', ['count is local and resets each call', 'counter cannot return integers', '+= subtracts one', 'print caches the first call'], 0, 'Local variables are recreated from zero every time the function is called.', 150),
    question(25, `data = [10, 20, 30]\ntry:\n    print(data[3])\nexcept IndexError:\n    print("missing")`, 2, 'Which output is produced?', ['30', 'missing', 'None', 'The program crashes'], 1, 'Index 3 is invalid, and the IndexError handler prints missing.', 150),
    question(26, `x = 7\nif x > 5 and < 10:\n    print("range")`, 1, 'What is the valid chained comparison?', ['if 5 < x < 10:', 'if x > 5 and < 10:', 'if x > 5 && x < 10:', 'if 5 > x > 10:'], 0, 'Python supports natural chained comparisons such as 5 < x < 10.', 150),
    question(27, `names = ["Ari", "Bo"]\nfor name in names:\n    names.remove(name)\nprint(names)`, 3, 'Why is mutating names during iteration risky?', ['It can skip items', 'remove only works on tuples', 'for loops stop at zero', 'print changes the list'], 0, 'Removing the current item shifts the next item into the skipped position.', 150),
    question(28, `def parse(value):\n    try:\n        return int(value)\n    except:\n        return None\nprint(parse("7"))`, 4, 'What is the strongest improvement here?', ['Catch ValueError explicitly', 'Remove int', 'Catch KeyboardInterrupt', 'Return the string'], 0, 'A narrow except ValueError documents and handles the expected conversion failure.', 150),
    question(29, `seen = set()\nfor item in ["a", "a", "b"]:\n    seen.add(item)\nprint(len(seen))`, 3, 'What does this print?', ['3', '2', '1', 'An error'], 1, 'Sets hold unique values, so the duplicate a is stored only once.', 150),
    question(30, `items = []\nprint(items.pop())`, 1, 'What error should the hunter anticipate?', ['Empty list cannot be popped', 'pop returns the first item', 'Lists cannot call methods', 'It prints an empty string'], 0, 'pop on an empty list raises IndexError because there is no item to remove.', 150),
  ],
};

const LEVELS: { id: LevelId; name: string; title: string; description: string; time: string; color: string }[] = [
  { id: 'easy', name: 'EASY', title: 'Bug Spotter', description: 'Learn the telltale signs. Take your time and build your streak.', time: 'NO TIMER', color: 'lime' },
  { id: 'mid', name: 'MID', title: 'Bug Tracker', description: 'The clock is live. Read fast, think clean, commit with confidence.', time: '45 SEC / Q', color: 'cyan' },
  { id: 'hard', name: 'HARD', title: 'Bug Boss', description: 'Deep logic, subtle traps, zero room for a lazy assumption.', time: '30 SEC / Q', color: 'coral' },
];

function playTone(kind: 'good' | 'bad' | 'click') {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = kind === 'good' ? 660 : kind === 'bad' ? 160 : 320;
    oscillator.type = kind === 'bad' ? 'sawtooth' : 'square';
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + .12);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + .12);
  } catch { /* audio is a progressive enhancement */ }
}

function Character({ state = 'idle' }: { state?: AgentState }) {
  const stateCopy: Record<AgentState, string> = {
    idle: 'SYSTEM READY', thinking: 'PARSING TRACE', inspecting: 'SCANNING LINE', correct: 'BUG CONFIRMED', wrong: 'FALSE POSITIVE', warning: 'CLOCK CRITICAL', complete: 'LEVEL CLEARED', result: 'HUNT LOGGED',
  };
  return (
    <div className="character-wrap" data-testid="character-agent">
      <div className="character">
        <div className="char-glow" />
        <div className="char-head" />
        <div className="char-hair" />
        <div className="char-eye left" /><div className="char-eye right" />
        <div className="char-neck" /><div className="char-mask" />
        <div className="char-hood" /><div className="char-body" />
        <div className="char-arm left" /><div className="char-arm right" />
        <div className="char-hand left" /><div className="char-hand right" />
        <div className="char-leg left" /><div className="char-leg right" />
        <div className="char-shoe left" /><div className="char-shoe right" />
        <div className="scanner" />
      </div>
      <span className="stage-label">{stateCopy[state]}</span>
    </div>
  );
}

function Topbar({ sound, setSound, goHome }: { sound: boolean; setSound: (value: boolean) => void; goHome: () => void }) {
  return (
    <header className="topbar">
      <button className="brand" onClick={goHome} data-testid="button-brand-home">
        <span className="brand-mark" /><span className="brand-name">BUG HUNT</span><span className="brand-sub">CODE // SECTOR 07</span>
      </button>
      <div className="top-actions">
        <span className="status-dot">HUNTER ONLINE</span>
        <button className="icon-btn" aria-label={sound ? 'Mute sound' : 'Enable sound'} onClick={() => setSound(!sound)} data-testid="button-sound">
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </header>
  );
}

function Home({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <main className="screen">
      <div className="home-layout">
        <section className="hero-copy">
          <div className="eyebrow">[ FIELD MANUAL / 001 ]</div>
          <h1>FIND THE<span>BUG.</span></h1>
          <p className="hero-lead">Python is clean until it is not. Read the trace, catch the defect, and prove you can see what the compiler misses.</p>
          <div className="button-row">
            <button className="primary-btn" onClick={() => navigate('levels')} data-testid="button-start-hunt">Start the hunt <ArrowRight size={16} /></button>
            <button className="secondary-btn" onClick={() => navigate('how')} data-testid="button-how-to-play">How it works</button>
          </div>
          <div className="microcopy"><span>30 CASE FILES</span><span>3 CLEARANCE LEVELS</span><span>NO LOGIN REQUIRED</span></div>
        </section>
        <section className="hero-character-stage" aria-label="Code Hunter character">
          <Character />
          <span className="floating-bug" />
        </section>
      </div>
    </main>
  );
}

function HowToPlay({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <main className="screen">
      <button className="back-link" onClick={() => navigate('home')} data-testid="button-how-back"><ArrowLeft size={14} /> Return to base</button>
      <div className="how-grid">
        <section className="how-panel">
          <div className="eyebrow">[ BRIEFING / 002 ]</div>
          <h2>READ THE<br /><span style={{ color: 'var(--cyan)' }}>EVIDENCE.</span></h2>
          <p>Every case shows a Python snippet with one suspicious line. Your scanner is only as good as your reasoning: choose the fix that makes the whole program behave correctly.</p>
          <div className="rule-list">
            <div className="rule"><span className="rule-no">01</span><div><strong>Inspect the highlighted line</strong><span>Look for syntax, logic, indexing, or control-flow traps.</span></div></div>
            <div className="rule"><span className="rule-no">02</span><div><strong>Commit to one fix</strong><span>Four choices. One correct answer. A fast answer earns a bonus.</span></div></div>
            <div className="rule"><span className="rule-no">03</span><div><strong>Protect your streak</strong><span>Correct answers compound your score. Wrong answers reset the run.</span></div></div>
          </div>
          <div className="button-row" style={{ marginTop: 30 }}><button className="primary-btn" onClick={() => navigate('levels')} data-testid="button-briefing-start">Choose clearance <ArrowRight size={16} /></button></div>
        </section>
        <section className="how-panel" style={{ background: 'rgba(9,24,32,.58)' }}>
          <div className="eyebrow">[ LOADOUT ]</div>
          <div className="rule-list">
            <div className="rule"><Terminal size={20} color="var(--cyan)" /><div><strong>Python fundamentals</strong><span>Syntax, conditions, loops, functions and lists.</span></div></div>
            <div className="rule"><Timer size={20} color="var(--cyan)" /><div><strong>Pressure protocol</strong><span>Mid and Hard add a live countdown to every question.</span></div></div>
            <div className="rule"><Keyboard size={20} color="var(--cyan)" /><div><strong>Keyboard ready</strong><span>Use A, B, C, or D to answer. Enter advances the case.</span></div></div>
            <div className="rule"><Zap size={20} color="var(--lime)" /><div><strong>Fast-answer bonus</strong><span>Beat the clock and your scanner awards extra points.</span></div></div>
          </div>
        </section>
      </div>
    </main>
  );
}

function LevelSelect({ navigate, startLevel }: { navigate: (screen: Screen) => void; startLevel: (id: LevelId) => void }) {
  return (
    <main className="screen">
      <button className="back-link" onClick={() => navigate('home')} data-testid="button-levels-back"><ArrowLeft size={14} /> Return to base</button>
      <div className="section-head"><div><div className="eyebrow">[ SELECT CLEARANCE / 003 ]</div><h2>CHOOSE YOUR<br />HUNT.</h2></div><div className="section-note">Three sectors. Ten cases each. Clearance determines the pressure, not the truth.</div></div>
      <div className="level-grid">
        {LEVELS.map((level, index) => (
          <button key={level.id} className={`level-card ${level.color}`} onClick={() => startLevel(level.id)} data-testid={`button-level-${level.id}`}>
            <span className="level-num">0{index + 1} / {level.name}</span>
            <h3>{level.title}</h3><h4>{level.time}</h4><p>{level.description}</p>
            <div className="level-meta"><span>10 CASE FILES</span><span>{level.id === 'hard' ? '150' : level.id === 'mid' ? '125' : '100'} PTS BASE</span></div>
          </button>
        ))}
      </div>
    </main>
  );
}

function CodeBlock({ code, suspicious }: { code: string; suspicious: number }) {
  return (
    <div className="code-window" data-testid="code-snippet">
      <div className="code-title"><span className="code-dots"><i /><i /><i /></span><span>case_file.py</span><span>READ ONLY</span></div>
      <pre>{code.split('\n').map((line, index) => <span className={`code-line ${index === suspicious ? 'suspect' : ''}`} key={`${index}-${line}`}><span className="line-number">{String(index + 1).padStart(2, '0')}</span>{line || ' '}{'\n'}</span>)}</pre>
    </div>
  );
}

function Game({ level, onComplete, sound }: { level: LevelId; onComplete: (score: number, correct: number, streak: number) => void; sound: boolean }) {
  const cases = QUESTIONS[level];
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [time, setTime] = useState(level === 'easy' ? null : level === 'mid' ? 45 : 30);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [agentState, setAgentState] = useState<AgentState>('thinking');
  const answerAt = useRef(Date.now());
  const current = cases[index];
  const locked = selected !== null;

  useEffect(() => {
    answerAt.current = Date.now();
    setSelected(null);
    setTime(level === 'easy' ? null : level === 'mid' ? 45 : 30);
    setAgentState('thinking');
  }, [index, level]);

  useEffect(() => {
    if (level === 'easy' || locked) return;
    const ticker = window.setInterval(() => {
      setTime((value) => {
        if (value === null || value <= 1) {
          window.clearInterval(ticker);
          setSelected(-1);
          setAgentState('warning');
          if (sound) playTone('bad');
          return 0;
        }
        if (value <= 6) setAgentState('warning');
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(ticker);
  }, [index, level, locked, sound]);

  const choose = (choice: number) => {
    if (locked) return;
    const isCorrect = choice === current.answer;
    const remaining = time ?? 0;
    const bonus = isCorrect && level !== 'easy' ? Math.min(50, Math.floor(remaining * 1.2)) : 0;
    const gained = isCorrect ? current.points + bonus : 0;
    setSelected(choice);
    setScore((value) => value + gained);
    setCorrect((value) => value + (isCorrect ? 1 : 0));
    setStreak((value) => {
      const next = isCorrect ? value + 1 : 0;
      setBestStreak((best) => Math.max(best, next));
      return next;
    });
    setAgentState(isCorrect ? 'correct' : 'wrong');
    if (sound) playTone(isCorrect ? 'good' : 'bad');
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!locked && ['a', 'b', 'c', 'd'].includes(event.key.toLowerCase())) choose(event.key.toLowerCase().charCodeAt(0) - 97);
      if (locked && event.key === 'Enter') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const next = () => {
    if (!locked) return;
    if (index === cases.length - 1) onComplete(score, correct, bestStreak);
    else setIndex((value) => value + 1);
  };
  const answerIsCorrect = selected === current.answer;
  const elapsed = (Date.now() - answerAt.current) / 1000;
  const quickBonus = answerIsCorrect && level !== 'easy' ? Math.min(50, Math.floor(Math.max(0, (time ?? 0)) * 1.2)) : 0;

  return (
    <main className="screen game-screen">
      <div className="game-top">
        <div className="progress-wrap"><div className="progress-row"><span>CASE {String(index + 1).padStart(2, '0')} / 10</span><span>{LEVELS.find((item) => item.id === level)?.title.toUpperCase()}</span></div><div className="progress-bar"><div className="progress-fill" style={{ width: `${((index + (locked ? 1 : 0)) / cases.length) * 100}%` }} /></div></div>
        <div className="hud"><div className="hud-box"><label>SCORE</label><strong data-testid="text-score">{score}</strong></div><div className={`hud-box ${time !== null && time <= 6 ? 'warning' : ''}`}><label>TIME</label><strong data-testid="text-timer">{time === null ? '—' : `${time}s`}</strong></div><div className="hud-box"><label>STREAK</label><strong data-testid="text-streak">{streak}x</strong></div></div>
      </div>
      <div className="question-layout">
        <section className="question-panel">
          <div className="question-label"><Crosshair size={15} /> <span>TRACE ANOMALY // {String(current.id).padStart(2, '0')}</span></div>
          <h2>{current.prompt}</h2>
          <CodeBlock code={current.code} suspicious={current.suspicious} />
          <div className="options">
            {current.options.map((option, optionIndex) => <button key={option} disabled={locked} className={`answer-btn ${selected !== null && optionIndex === current.answer ? 'correct' : ''} ${selected === optionIndex && optionIndex !== current.answer ? 'wrong' : ''}`} onClick={() => choose(optionIndex)} data-testid={`button-answer-${optionIndex}`}><span className="answer-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span></button>)}
          </div>
          {locked && <div className="feedback" data-testid="feedback-answer"><strong>{selected === -1 ? 'TIMEOUT / CASE LOST' : answerIsCorrect ? 'BUG CONFIRMED' : 'FALSE POSITIVE'}</strong><p>{selected === -1 ? `The correct fix was: ${current.options[current.answer]}.` : current.explanation}{quickBonus > 0 ? ` Fast scan bonus: +${quickBonus}.` : ''}</p></div>}
          <div className="next-row"><button className="primary-btn" onClick={next} disabled={!locked} data-testid="button-next-case">{index === cases.length - 1 ? 'Close case file' : 'Next case'} <ArrowRight size={16} /></button></div>
        </section>
        <aside className="agent-panel"><Character state={agentState} /><div className="agent-state"><strong>{agentState === 'warning' ? 'CLOCK CRITICAL' : agentState === 'correct' ? 'NICE CATCH' : agentState === 'wrong' ? 'RECHECK THE TRACE' : 'CODE HUNTER'}</strong><p>{agentState === 'thinking' ? 'The defect is hiding in plain sight.' : agentState === 'correct' ? 'Your read is clean. Keep moving.' : agentState === 'wrong' ? 'Every miss leaves a useful trace.' : 'Scan the highlighted line.'}</p></div></aside>
      </div>
    </main>
  );
}

function Complete({ score, correct, streak, level, navigate, next }: { score: number; correct: number; streak: number; level: LevelId; navigate: (screen: Screen) => void; next: () => void }) {
  return <main className="screen"><div className="result-card"><div className="eyebrow">[ SECTOR CLEARED / {level.toUpperCase()} ]</div><h2 className="section-head" style={{ justifyContent: 'center', margin: '26px 0 0' }}><span>GOOD HUNT.</span></h2><p style={{ color: 'var(--muted)', margin: '10px 0 0' }}>Ten case files processed. Your scanner is warm.</p><div className="result-score">{score}</div><div className="result-rank">CURRENT SCORE / POINTS</div><div className="result-detail"><span>CASES SOLVED<b>{correct} / 10</b></span><span>BEST STREAK<b>{streak}x</b></span><span>ACCURACY<b>{correct * 10}%</b></span></div><div className="button-row" style={{ justifyContent: 'center' }}><button className="primary-btn" onClick={next} data-testid="button-see-results">View hunt log <Trophy size={16} /></button><button className="secondary-btn" onClick={() => navigate('levels')} data-testid="button-replay-level">Replay a sector</button></div></div></main>;
}

function Results({ score, correct, streak, navigate, reset }: { score: number; correct: number; streak: number; navigate: (screen: Screen) => void; reset: () => void }) {
  const rank = correct === 10 ? 'ELITE CODE HUNTER' : correct >= 7 ? 'FIELD OPERATIVE' : correct >= 4 ? 'TRACE INITIATE' : 'ROOKIE SCANNER';
  return <main className="screen"><div className="result-card"><div className="eyebrow">[ FINAL HUNT LOG / 030 ]</div><h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: '.9', letterSpacing: '-.07em', margin: '22px 0 0' }}>TRACE<br /><span style={{ color: 'var(--cyan)' }}>COMPLETE.</span></h2><div className="result-score">{score}</div><div className="result-rank">{rank}</div><div className="result-detail"><span>CASES SOLVED<b>{correct} / 10</b></span><span>BEST STREAK<b>{streak}x</b></span><span>ACCURACY<b>{correct * 10}%</b></span></div><div className="button-row" style={{ justifyContent: 'center' }}><button className="primary-btn" onClick={() => navigate('levels')} data-testid="button-new-hunt">New hunt <RotateCcw size={16} /></button><button className="secondary-btn" onClick={reset} data-testid="button-return-home">Return to base</button></div></div></main>;
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [level, setLevel] = useState<LevelId>('easy');
  const [sound, setSound] = useState(true);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const navigate = (nextScreen: Screen) => { setScreen(nextScreen); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const startLevel = (id: LevelId) => { setLevel(id); setScore(0); setCorrect(0); setStreak(0); navigate('game'); };
  const goHome = () => navigate('home');
  const nextAfterComplete = () => navigate('result');
  const activeScreen = useMemo(() => {
    if (screen === 'home') return <Home navigate={navigate} />;
    if (screen === 'how') return <HowToPlay navigate={navigate} />;
    if (screen === 'levels') return <LevelSelect navigate={navigate} startLevel={startLevel} />;
    if (screen === 'game') return <Game level={level} sound={sound} onComplete={(finalScore, finalCorrect, bestStreak) => { setScore(finalScore); setCorrect(finalCorrect); setStreak(bestStreak); navigate('complete'); }} />;
    if (screen === 'complete') return <Complete score={score} correct={correct} streak={streak} level={level} navigate={navigate} next={nextAfterComplete} />;
    return <Results score={score} correct={correct} streak={streak} navigate={navigate} reset={goHome} />;
  }, [screen, level, sound, score, correct, streak]);
  return <div className="app-shell"><Topbar sound={sound} setSound={setSound} goHome={goHome} />{activeScreen}</div>;
}

export default App;