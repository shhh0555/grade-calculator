// 頂部進度條：走過的步驟可以點回去改
window.GC = window.GC || {};
GC.components = GC.components || {};

GC.components.progressBar = function (current, maxStep) {
  const steps = GC.config.STEPS.map((s, i) => {
    const no = i + 1;
    const mod = no === current ? 'progress__step--current' : no <= maxStep ? 'progress__step--done' : '';
    const inner = `<span class="progress__no">${no}</span><span class="progress__label">${s.label}</span>`;
    const body = no <= maxStep && no !== current ? `<a href="#/${s.key}">${inner}</a>` : `<span>${inner}</span>`;
    return `<li class="progress__step ${mod}" ${no === current ? 'aria-current="step"' : ''}>${body}</li>`;
  }).join('');
  return `<ol class="progress" aria-label="填寫進度">${steps}</ol>`;
};
