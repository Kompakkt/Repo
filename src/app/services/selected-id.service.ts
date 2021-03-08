const selectionMap = new Map<string, Map<string, string>>();

export const setMapping = (element_id: string, property: string, related_id: string) => {
  if (!related_id || !element_id) return;
  if (!selectionMap.get(element_id)) {
    selectionMap.set(element_id, new Map<string, string>());
  }
  const innerMap = selectionMap.get(element_id);
  if (innerMap) {
    innerMap.set(property, related_id);
  }
};

export const getMapping = (element_id: string, property: string) => {
  const innerMap = selectionMap.get(element_id);
  if (!innerMap) {
    return undefined;
  }
  const result = innerMap.get(property);
  if (!result) {
    return undefined;
  }
  return result;
};

export const showMap = () => {
  console.log(selectionMap);
};
