type SpikeAmplitudesClient = {
  getUnitSpikeAmplitudes: (unitId: number | string) => Promise<{ times: number[]; amplitudes: number[] }>;
};

export default SpikeAmplitudesClient;
