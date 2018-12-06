const topologicalOrder = nodes => {
  const result = [];
  let workQueue = nodes;

  while (workQueue.length > 0) {
    const newWork = [];
    for (const node of workQueue) {
      result.push(node);
      newWork.push(...node.localDependencies);
    }
    workQueue = newWork;
  }

  return Array.from(new Set(result.reverse()));
};

module.exports = topologicalOrder;
