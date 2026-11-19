// This file connects the evolutionary algorithm to a visible canvas.
// The simulation remains authoritative; the canvas only displays selected
// state and the original game is used later for the final showcase.
const evolutionView = document.getElementById('evolution-view');
const evolutionCanvas = document.getElementById('evolutionCanvas');
const evolutionContext = evolutionCanvas.getContext('2d');
const evolutionStatus = document.getElementById('evolution-status');
const evolutionStopButton = document.getElementById('evolution-stop-btn');

let liveEvolutionState = null;

evolutionStopButton.addEventListener('click', stopLiveEvolution);

function startLiveEvolution(generations = 1000, options = {}) {
  // Stop an older run before creating a new population and animation loop.
  stopLiveEvolution();
  window.liveEvolutionActive = true;
  window.aiPlaybackActive = false;

  const settings = Object.assign({
    // Warm-up prevents a lucky early result or a temporary plateau from
    // stopping training before the population has had time to explore.
    minimumGenerations: 100,
    targetScore: 10,
    patience: 50,
    // This is an optional whole-training safety limit. Leave it disabled
    // by default because the requested limit applies per generation.
    maxRuntimeMs: null,
    maxGenerationRuntimeMs: 10 * 60 * 1000,
    validationEpisodes: 5
  }, options, {
    maxGenerations: generations
  });

  const population = createPopulation();
  liveEvolutionState = {
    population,
    generation: 1,
    totalGenerations: settings.maxGenerations,
    settings,
    // All birds in the current generation share this course for fair
    // comparison. A new one is created after each generation.
    pipeSequence: createPipeSequence(),
    agents: [],
    frames: 0,
    running: true,
    best: null,
    bestOverall: null,
    mode: 'evolution',
    playbackSimulation: null,
    transitioning: false,
    generationsWithoutImprovement: 0,
    startedAt: performance.now(),
    generationStartedAt: performance.now(),
    stopReason: null,
    validation: null,
    history: []
  };

  evolutionView.classList.remove('hidden');
  startLiveGeneration();
  requestAnimationFrame(runLiveEvolutionFrame);
}

function stopLiveEvolution() {
  // Setting running to false makes any pending animation callback harmless.
  window.liveEvolutionActive = false;
  window.aiPlaybackActive = false;

  if (liveEvolutionState) {
    liveEvolutionState.running = false;
  }

  liveEvolutionState = null;
  evolutionView.classList.add('hidden');
}

function startLiveGeneration() {
  const state = liveEvolutionState;

  // Give every genome its own simulation state while sharing the course.
  state.agents = state.population.map(genome => ({
    genome,
    simulation: createHeadlessSimulation(state.pipeSequence)
  }));
  state.frames = 0;
  state.generationStartedAt = performance.now();
}

function runLiveEvolutionFrame() {
  const state = liveEvolutionState;

  if (!state || !state.running || state.transitioning) {
    return;
  }

  const elapsedTrainingTime = performance.now() - state.startedAt;
  if (
    Number.isFinite(state.settings.maxRuntimeMs) &&
    elapsedTrainingTime >= state.settings.maxRuntimeMs
  ) {
    // An optional whole-training safety valve remains available through
    // maxRuntimeMs, but is disabled by default.
    finishLiveTraining('TIME LIMIT REACHED');
    return;
  }

  const elapsedGenerationTime =
    performance.now() - state.generationStartedAt;
  if (
    elapsedGenerationTime >=
    state.settings.maxGenerationRuntimeMs
  ) {
    // A generation now ends because of elapsed time, not because it passed
    // a fixed number of pipes or simulation frames.
    finishLiveGeneration('GENERATION TIME LIMIT REACHED');
    return;
  }

  for (const agent of state.agents) {
    if (agent.simulation.done) {
      continue;
    }

    // Each visible frame advances every living bird once.
    const observation = getHeadlessObservation(agent.simulation);
    const action = chooseAction(agent.genome, observation);
    stepHeadlessSimulation(agent.simulation, action);
  }

  state.frames++;

  // Keep the simulations at 60 Hz while limiting expensive canvas rendering
  // to 30 Hz. Rendering is presentation, not part of the environment.
  if (state.frames % 2 === 0) {
    drawLiveEvolution();
  }

  const everyoneDone = state.agents.every(
    agent => agent.simulation.done
  );

  if (everyoneDone) {
    finishLiveGeneration();
    return;
  }

  requestAnimationFrame(runLiveEvolutionFrame);
}

function finishLiveGeneration(reason = null) {
  const state = liveEvolutionState;

  // Convert simulation state into the fitness records used by selection.
  const results = state.agents.map(agent => ({
    genome: agent.genome,
    score: agent.simulation.score,
    survivalFrames: agent.simulation.frames,
    bestGapDistance: agent.simulation.bestGapDistance,
    totalReward: agent.simulation.totalReward
  }));
  const nextGeneration = createNextGeneration(results);
  const best = nextGeneration.ranking[0];
  const averageScore =
    results.reduce((total, result) => total + result.score, 0) /
    results.length;

  state.best = best;
  state.history.push({
    generation: state.generation,
    bestScore: best.score,
    averageScore,
    bestSurvivalFrames: best.survivalFrames,
    bestReward: best.totalReward
  });

  // Update the hall of fame independently from the current generation.
  if (
    !state.bestOverall ||
    compareFitness(best, state.bestOverall) < 0
  ) {
    state.bestOverall = {
      ...best,
      genome: cloneGenome(best.genome)
    };
    state.bestGeneration = state.generation;
    state.generationsWithoutImprovement = 0;
  } else {
    state.generationsWithoutImprovement++;
  }

  let stopReason = null;
  const pastWarmup =
    state.generation >= state.settings.minimumGenerations;

  if (state.generation >= state.totalGenerations) {
    stopReason = 'MAX GENERATIONS REACHED';
  } else if (pastWarmup && state.bestOverall.score >= state.settings.targetScore) {
    stopReason = 'TARGET SCORE REACHED';
  } else if (
    pastWarmup &&
    state.generationsWithoutImprovement >= state.settings.patience
  ) {
    stopReason = 'NO IMPROVEMENT';
  }

  if (stopReason) {
    // Validation and showcase happen only after a stopping condition.
    finishLiveTraining(stopReason);
    return;
  }

  const nextPopulation = createNextGeneration(
    results,
    state.bestOverall.genome
  ).population;

  state.population = nextPopulation;
  // Give each generation a fresh course so the population cannot memorize
  // one pipe sequence.
  state.pipeSequence = createPipeSequence();
  state.generation++;
  state.transitioning = true;
  evolutionStatus.textContent =
    `${reason ? reason + '  ' : ''}` +
    `GENERATION ${state.generation - 1} COMPLETE  ` +
    `BEST PIPES: ${best.score}  NEXT GENERATION STARTING...`;

  setTimeout(() => {
    if (liveEvolutionState && liveEvolutionState.running) {
      liveEvolutionState.transitioning = false;
      startLiveGeneration();
      requestAnimationFrame(runLiveEvolutionFrame);
    }
  }, 1400);
}

function finishLiveTraining(reason) {
  const state = liveEvolutionState;

  if (!state || state.transitioning) {
    return;
  }

  state.transitioning = true;
  state.stopReason = reason;
  // Test the historical champion on several unseen courses before using it
  // in the real game. This separates "best training result" from
  // "generalizes reliably."
  state.validation = validateGenome(
    state.bestOverall.genome,
    state.settings.validationEpisodes
  );

  console.table(state.history);
  console.table(state.validation.evaluations);
  evolutionStatus.textContent =
    `${reason}  BEST GEN: ${state.bestGeneration}  ` +
    `VALIDATION AVG: ${state.validation.averageScore.toFixed(2)}  ` +
    `MIN: ${state.validation.minimumScore}  ` +
    `MAX: ${state.validation.maximumScore}  ` +
    `SHOWCASE STARTING...`;

  setTimeout(() => {
    if (liveEvolutionState && liveEvolutionState.running) {
      startBestGamePlayback(state.bestOverall.genome);
    }
  }, 1800);
}

function startBestGamePlayback(genome) {
 // Copy the policy before handing it to the real game so later training
 // state cannot mutate the genome being demonstrated.
 const bestGenome = cloneGenome(genome);

 stopLiveEvolution();
 window.bestGenomeForPlayback = bestGenome;
 startGame();
 window.aiPlaybackActive = true;
 pipes.spawn();
}

function updateEvolutionStatus(best) {
  if (!liveEvolutionState) {
    return;
  }

  evolutionStatus.textContent =
    `GENERATION ${liveEvolutionState.generation}/` +
    `${liveEvolutionState.totalGenerations}  ` +
    `BEST PIPES: ${best.score}  ` +
    `BEST FRAMES: ${best.survivalFrames}  ` +
    `REWARD: ${best.totalReward}`;
}

function drawLiveEvolution() {
  const state = liveEvolutionState;
  const ctx = evolutionContext;

  const skyGradient = ctx.createLinearGradient(0, 0, 0, 540);
  skyGradient.addColorStop(0, '#8fd8ff');
  skyGradient.addColorStop(1, '#e8f8ff');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, 360, 540);

  // Show the pipes from one living simulation while drawing all birds.
  const displayAgent =
    state.agents.find(agent => !agent.simulation.done) ||
    state.agents[0];
  const displaySimulation = displayAgent.simulation;

  ctx.fillStyle = '#65bf72';
  ctx.fillRect(0, 540, 360, 100);

  for (const pipe of displaySimulation.pipes) {
    ctx.fillStyle = '#4aa76b';
    ctx.fillRect(pipe.x, 0, SIMULATION_PIPE_WIDTH, pipe.top);
    ctx.fillRect(
      pipe.x,
      SIMULATION_GROUND_Y - pipe.bottom,
      SIMULATION_PIPE_WIDTH,
      pipe.bottom
    );
  }

  // Living birds are bright; terminal birds are gray so survival is visible.
  for (const agent of state.agents) {
    const simulation = agent.simulation;
    const bird = simulation.bird;

    ctx.beginPath();
    ctx.arc(bird.x, bird.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = simulation.done
      ? 'rgba(95, 95, 95, 0.35)'
      : 'rgba(255, 65, 145, 0.85)';
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '10px "Press Start 2P", cursive';
  // These metrics describe the current generation, not the hall-of-fame
  // champion. The status text updates every other simulation frame.
  const scores = state.agents.map(
    agent => agent.simulation.score
  );
  const averageScore =
    scores.reduce((total, score) => total + score, 0) /
    scores.length;
  const bestScore = Math.max(...scores);
  const aliveCount = state.agents.filter(
    agent => !agent.simulation.done
  ).length;

  evolutionStatus.textContent =
    `GEN ${state.generation}/${state.totalGenerations}  ` +
    `BEST PIPES: ${bestScore}  ` +
    `AVG PIPES: ${averageScore.toFixed(2)}  ` +
    `ALIVE: ${aliveCount}`;

  ctx.fillText(`ALIVE: ${aliveCount}`, 14, 58);
}
