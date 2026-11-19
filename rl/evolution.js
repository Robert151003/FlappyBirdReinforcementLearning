// Evolutionary hyperparameters.
// A population is evaluated, the best genomes are retained, and the rest
// are produced by mutating those successful parents.
const EVOLUTION_POPULATION_SIZE = 100;
const EVOLUTION_ELITE_COUNT = 5;
// Headless evaluation is synchronous, so it needs a frame safety ceiling
// to keep browser validation responsive. Live training uses its own
// wall-clock generation timer in rl/live-evolution.js.
const EVOLUTION_HEADLESS_MAX_FRAMES = 5000;
const EVOLUTION_RANDOM_IMMIGRANT_RATE = 0.1;

function evaluateGenome(genome, pipeSequence) {
  // Run one genome through one complete course. This is the fitness test
  // for a candidate policy.
  const simulation = createHeadlessSimulation(pipeSequence);

  while (
    !simulation.done &&
    simulation.frames < EVOLUTION_HEADLESS_MAX_FRAMES
  ) {
    // Each loop is one environment transition:
    // observe -> choose action -> advance simulation.
    const observation = getHeadlessObservation(simulation);
    const action = chooseAction(genome, observation);
    stepHeadlessSimulation(simulation, action);
  }

  return {
    genome,
    score: simulation.score,
    survivalFrames: simulation.frames,
    bestGapDistance: simulation.bestGapDistance,
    totalReward: simulation.totalReward
  };
}

function validateGenome(genome, sequenceCount = 5) {
  // Training performance on one course can be misleading. Validation uses
  // fresh courses that the genome did not evolve directly against.
  const evaluations = [];

  for (let i = 0; i < sequenceCount; i++) {
    const result = evaluateGenome(genome, createPipeSequence());
    evaluations.push({
      score: result.score,
      survivalFrames: result.survivalFrames,
      totalReward: result.totalReward
    });
  }

  const scores = evaluations.map(result => result.score);
  const totalScore = scores.reduce(
    (total, score) => total + score,
    0
  );

  return {
    evaluations,
    averageScore: totalScore / evaluations.length,
    minimumScore: Math.min(...scores),
    maximumScore: Math.max(...scores)
  };
}

function createPopulation(size = EVOLUTION_POPULATION_SIZE) {
  // Generation zero contains entirely random policies.
  const population = [];

  for (let i = 0; i < size; i++) {
    population.push(createRandomGenome());
  }

  return population;
}

function compareFitness(first, second) {
  // Fitness is lexicographic: the first criterion that differs decides.
  // Passing pipes is the objective; survival and gap alignment are useful
  // tie-breakers when no bird has made much progress yet.
  if (first.score !== second.score) {
    return second.score - first.score;
  }

  if (first.survivalFrames !== second.survivalFrames) {
    return second.survivalFrames - first.survivalFrames;
  }

  if (first.bestGapDistance !== second.bestGapDistance) {
    return first.bestGapDistance - second.bestGapDistance;
  }

  return second.totalReward - first.totalReward;
}

function createNextGeneration(results, championGenome = null) {
  // Sort without mutating the original results array.
  const sortedResults = [...results].sort(compareFitness);

  // The hall-of-fame champion is copied into the next generation so a
  // later unlucky course cannot destroy the best policy found so far.
  const nextPopulation = championGenome
    ? [cloneGenome(championGenome)]
    : [];

  nextPopulation.push(
    // Elites survive unchanged. The current setting keeps the top five.
    ...sortedResults
    .slice(0, EVOLUTION_ELITE_COUNT)
    .map(result => cloneGenome(result.genome))
  );

  while (nextPopulation.length < EVOLUTION_POPULATION_SIZE) {
    if (Math.random() < EVOLUTION_RANDOM_IMMIGRANT_RATE) {
      // Random immigrants prevent the population from collapsing around
      // one behavior and restore exploration when it converges too early.
      nextPopulation.push(createRandomGenome());
      continue;
    }

    // Otherwise select one of the elite parents and mutate it.
    const parentIndex = Math.floor(
      Math.random() * EVOLUTION_ELITE_COUNT
    );
    const parent = sortedResults[parentIndex].genome;
    nextPopulation.push(mutateGenome(parent));
  }

  return {
    population: nextPopulation,
    ranking: sortedResults
  };
}

async function runEvolution(generations = 20) {
  // This is the console/headless version of training. The live UI uses the
  // same selection functions but advances one frame per animation callback.
  let population = createPopulation();
  let champion = null;

  for (let generation = 1; generation <= generations; generation++) {
    // A new course each generation tests whether the policy generalizes
    // rather than memorizing one pipe layout.
    const pipeSequence = createPipeSequence();
    const results = population.map(genome =>
      evaluateGenome(genome, pipeSequence)
    );
    const ranking = [...results].sort(compareFitness);
    // Update the hall of fame only when the new result is genuinely better.
    if (!champion || compareFitness(ranking[0], champion) < 0) {
      champion = {
        ...ranking[0],
        genome: cloneGenome(ranking[0].genome)
      };
    }

    const nextGeneration = createNextGeneration(
      results,
      champion.genome
    );
    const best = nextGeneration.ranking[0];

    console.log({
      generation,
      bestScore: best.score,
      bestSurvivalFrames: best.survivalFrames,
      bestReward: best.totalReward
    });

    population = nextGeneration.population;
  }

  return population;
}