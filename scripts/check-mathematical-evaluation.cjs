const assert = require('node:assert/strict');
const esbuild = require('esbuild');

function load(entry) {
  const code = esbuild.buildSync({ entryPoints: [entry], bundle: true, format: 'cjs', platform: 'node', write: false }).outputFiles[0].text;
  const mod = { exports: {} };
  new Function('module', 'exports', code)(mod, mod.exports);
  return mod.exports;
}
const { evaluateSolvoxChapter } = load('frontend/src/services/solvoxEvaluation.js');
const { getMathematicalReview, getChapterMathFocus } = load('frontend/src/services/mathematicalReview.js');
const questionIds = [1, 11, 25, 31, 41];
for (const lang of ['id', 'en']) {
  for (let chapterId = 1; chapterId <= 5; chapterId++) {
    const questionId = questionIds[chapterId - 1];
    const result = { chapterId, lang, totalQuestions: 1, questionLogs: [{
      questionId, correct: true, simulation: { stepsTotal: 2, stepsCompleted: 2, modelErrors: 0, stepErrors: 1,
        stepErrorHistory: [{ step: 1, kind: 'wrong-operation-on-both-sides', operation: '* 3' }],
      },
    }] };
    const feedback = evaluateSolvoxChapter(result);
    assert.equal(feedback.category, 'mathematical-review', 'Corrected automatic answers must not count as error-free mastery');
    assert.ok(getChapterMathFocus(chapterId, lang).length > 40);
    assert.match(feedback.message, /→/, 'Feedback must include the mathematically correct step');
    assert.doesNotMatch(feedback.message, /undefined|NaN/);
    result.questionLogs[0].simulation.stepErrors = 0;
    result.questionLogs[0].simulation.stepErrorHistory = [];
    assert.equal(evaluateSolvoxChapter(result).category, 'master');
    result.questionLogs[0].simulation.stepsCompleted = 1;
    assert.equal(evaluateSolvoxChapter(result).category, 'simulation-progress');
  }
  const model = { chapterId: 5, totalQuestions: 1, lang, questionLogs: [{ questionId: 41, correct: true,
    simulation: { stepsTotal: 2, stepsCompleted: 2, stepErrors: 0, modelErrors: 1 },
  }] };
  assert.equal(evaluateSolvoxChapter(model).category, 'mathematical-review');
  assert.match(getMathematicalReview(model, lang)[0], /3\(x/);
  const distribution = { chapterId: 3, questionLogs: [{ questionId: 30, simulation: { stepErrors: 1,
    stepErrorHistory: [{ kind: 'parentheses-or-like-term-error', step: 1 }],
  } }] };
  assert.match(getMathematicalReview(distribution, lang)[0], /−2\(x \+ 3\) = −2x − 6/);
  console.log(`PASS (${lang}): mathematical review for all chapters, actual worked steps, incomplete progress, and modeling corrections`);
}
