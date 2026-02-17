export const stripRootSegment = (path: string): string => {
  const segments = path.split('/');
  return segments.length > 1 ? segments.slice(1).join('/') : path;
};

export const getLastSegment = (path: string): string => {
  const segments = path.split('/');
  return segments[segments.length - 1];
};

export interface FolderGroup<T> {
  groupName: string;
  items: T[];
}

export const groupByRootFolder = <T>(
  items: T[],
  getPath: (item: T) => string
): FolderGroup<T>[] => {
  const groupMap = new Map<string, T[]>();

  for (const item of items) {
    const strippedPath = stripRootSegment(getPath(item));
    const segments = strippedPath.split('/');
    const groupName = segments[0];

    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, []);
    }
    groupMap.get(groupName)!.push(item);
  }

  return Array.from(groupMap.entries()).map(([groupName, groupItems]) => ({
    groupName,
    items: groupItems,
  }));
};
