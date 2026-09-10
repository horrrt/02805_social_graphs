export const voiceNames = ["Sine", "Triangle", "Soft sawtooth", "Soft square"];
export const pitch = (node) =>
  48 + Math.round((36 * Math.log1p(node.degree)) / Math.log(107));
export const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
export function scheduleNotes(context, master, nodes, tempo, start) {
  const handles = [],
    beat = 60 / tempo;
  nodes.forEach((node, i) => {
    const time = start + i * beat,
      osc = context.createOscillator(),
      gain = context.createGain(),
      filter = context.createBiquadFilter();
    osc.type = ["sine", "triangle", "sawtooth", "square"][node.community % 4];
    osc.frequency.value = frequency(pitch(node));
    filter.type = "lowpass";
    filter.frequency.value = 1700;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.65, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + beat * 0.85);
    osc.connect(filter).connect(gain).connect(master);
    osc.start(time);
    osc.stop(time + beat * 0.9);
    handles.push(osc);
  });
  return handles;
}
export function wav(buffer) {
  const values = buffer.getChannelData(0),
    out = new ArrayBuffer(44 + values.length * 2),
    v = new DataView(out);
  const chars = (offset, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i));
  };
  chars(0, "RIFF");
  v.setUint32(4, 36 + values.length * 2, true);
  chars(8, "WAVE");
  chars(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, buffer.sampleRate, true);
  v.setUint32(28, buffer.sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  chars(36, "data");
  v.setUint32(40, values.length * 2, true);
  for (let i = 0; i < values.length; i++) {
    const n = Math.max(-1, Math.min(1, values[i]));
    v.setInt16(44 + i * 2, Math.round(n * (n < 0 ? 32768 : 32767)), true);
  }
  return out;
}
