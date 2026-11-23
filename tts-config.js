export function getBestFemaleVoice() {
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  const esVoices = voices.filter(v => /^es/i.test(v.lang));
  const preferred = [
    /Dalia|Paulina|Sabina|Helena|Lucia|Laura|Monica|Camila|Sofia|Valentina|Paloma|Elvira|Salome|Andrea/i,
    /Natural|Neural|Online|Google español|Microsoft/i
  ];
  for (const rx of preferred) {
    const match = esVoices.find(v => rx.test(v.name) && !/Jorge|Pablo|Raul|Alvaro|Diego|Carlos|Enrique|Tomas|Manuel/i.test(v.name));
    if (match) return match;
  }
  return esVoices.find(v => !/Jorge|Pablo|Raul|Alvaro|Diego|Carlos|Enrique|Tomas|Manuel/i.test(v.name)) || esVoices[0] || voices[0] || null;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => getBestFemaleVoice();
  const origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
  window.speechSynthesis.speak = function (utterance) {
    const female = getBestFemaleVoice();
    if (female) utterance.voice = female;
    utterance.lang = (female && female.lang) || "es-MX";
    utterance.pitch = 1.05;
    utterance.rate = 1.02;
    return origSpeak(utterance);
  };
}