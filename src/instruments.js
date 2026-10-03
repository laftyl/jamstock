const DEFAULT_INSTRUMENT_MAPPINGS = [
  {
    label: 'Guitar',
    pattern: 'guitar',
    pattern_type: 'regex',
    primary_roles: ['melody', 'rhythm'],
    secondary_roles: ['bass'],
    tertiary_roles: [],
    notes: 'Use primary roles first; use bass as fallback.',
  },
  {
    label: 'Bass',
    pattern: 'bass',
    pattern_type: 'regex',
    primary_roles: ['bass', 'rhythm'],
    secondary_roles: ['melody'],
    tertiary_roles: [],
    notes: 'Protect bass as a primary role when possible.',
  },
  {
    label: 'Keys/piano',
    pattern: 'keys?|piano',
    pattern_type: 'regex',
    primary_roles: ['melody', 'rhythm'],
    secondary_roles: ['bass'],
    tertiary_roles: [],
    notes: 'Can cover bass when a band lacks bass capability.',
  },
  {
    label: 'Percussion/drums',
    pattern: 'percussion|drums?',
    pattern_type: 'regex',
    primary_roles: ['percussion', 'rhythm'],
    secondary_roles: [],
    tertiary_roles: [],
    notes: 'At least one percussion-capable participant is required.',
  },
  {
    label: 'Vocalist',
    pattern: 'vocal|singer',
    pattern_type: 'regex',
    primary_roles: ['melody'],
    secondary_roles: ['rhythm'],
    tertiary_roles: [],
    notes: 'Vocal coverage is preferred but optional.',
  },
  {
    label: 'Brass',
    pattern: 'brass|trumpet|trombone|tuba|saxophone',
    pattern_type: 'regex',
    primary_roles: ['melody', 'rhythm'],
    secondary_roles: ['bass'],
    tertiary_roles: [],
    notes: 'Refine by specific instrument when needed.',
  },
  {
    label: 'Strings',
    pattern: 'strings?|violin|viola|cello',
    pattern_type: 'regex',
    primary_roles: ['melody', 'rhythm'],
    secondary_roles: ['bass'],
    tertiary_roles: [],
    notes: 'Refine by specific instrument when needed.',
  },
  {
    label: 'Winds',
    pattern: 'winds?|flute|clarinet|oboe|bassoon',
    pattern_type: 'regex',
    primary_roles: ['melody', 'rhythm'],
    secondary_roles: ['bass'],
    tertiary_roles: [],
    notes: 'Refine by specific instrument when needed.',
  },
  {
    label: 'Electronic musician',
    pattern: 'electronic musician|production',
    pattern_type: 'regex',
    primary_roles: ['production', 'rhythm'],
    secondary_roles: ['melody', 'bass'],
    tertiary_roles: [],
    notes: 'Can cover production and electronic performance.',
  },
  {
    label: 'Recording/mixing engineer',
    pattern: 'recording.*engineer|mixing.*engineer|recording.*mixing',
    pattern_type: 'regex',
    primary_roles: ['production'],
    secondary_roles: [],
    tertiary_roles: [],
    notes: 'Producer-only participants are assigned separately.',
  },
  {
    label: 'Other',
    pattern: '^other$|^other:',
    pattern_type: 'regex',
    primary_roles: ['manual review'],
    secondary_roles: ['manual review'],
    tertiary_roles: ['manual review'],
    notes: 'Unknown values are flagged for manual review.',
  },
];

function resolveInstrumentRoles(instrumentNames, mappingRows = DEFAULT_INSTRUMENT_MAPPINGS) {
  return instrumentNames.map((instrument) => {
    const mapping = mappingRows.find((row) => {
      const pattern = row.pattern_type === 'literal'
        ? new RegExp(`^${escapeRegExp(row.pattern)}$`, 'i')
        : new RegExp(row.pattern, 'i');
      return pattern.test(instrument);
    });

    return {
      instrument,
      roles: mapping
        ? [...mapping.primary_roles, ...mapping.secondary_roles, ...mapping.tertiary_roles]
        : ['manual review'],
      matched_mapping: mapping?.label ?? null,
    };
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  DEFAULT_INSTRUMENT_MAPPINGS,
  resolveInstrumentRoles,
};