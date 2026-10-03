function createWorkspaceRepository(db) {
  const deleteProducerAssignments = db.prepare('DELETE FROM producer_assignments');
  const deleteBandMembers = db.prepare('DELETE FROM band_members');
  const deleteBands = db.prepare('DELETE FROM bands');
  const deleteParticipants = db.prepare('DELETE FROM participants');
  const reset = db.transaction(() => {
    deleteProducerAssignments.run();
    deleteBandMembers.run();
    deleteBands.run();
    deleteParticipants.run();
  });

  return { reset };
}

module.exports = { createWorkspaceRepository };