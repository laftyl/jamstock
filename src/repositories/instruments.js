const { DEFAULT_INSTRUMENT_MAPPINGS } = require('../instruments');

function createInstrumentRepository(db) {
  const countMappings = db.prepare('SELECT COUNT(*) AS count FROM instrument_mappings');
  const insertMapping = db.prepare(`
    INSERT INTO instrument_mappings (
      label, pattern, pattern_type, primary_roles, secondary_roles,
      tertiary_roles, notes, sort_order
    ) VALUES (
      @label, @pattern, @pattern_type, @primary_roles,
      @secondary_roles, @tertiary_roles, @notes, @sort_order
    )
  `);
  const insertDefaults = db.transaction(() => {
    DEFAULT_INSTRUMENT_MAPPINGS.forEach((mapping, index) => {
      insertMapping.run({
        ...mapping,
        primary_roles: JSON.stringify(mapping.primary_roles),
        secondary_roles: JSON.stringify(mapping.secondary_roles),
        tertiary_roles: JSON.stringify(mapping.tertiary_roles),
        sort_order: index,
      });
    });
  });
  const selectMappings = db.prepare('SELECT * FROM instrument_mappings WHERE enabled = 1 ORDER BY sort_order, id');

  return {
    ensureDefaults() {
      if (countMappings.get().count === 0) {
        insertDefaults();
      }
    },
    all() {
      return selectMappings.all().map((mapping) => ({
        ...mapping,
        primary_roles: JSON.parse(mapping.primary_roles),
        secondary_roles: JSON.parse(mapping.secondary_roles),
        tertiary_roles: JSON.parse(mapping.tertiary_roles),
      }));
    },
  };
}

module.exports = { createInstrumentRepository };