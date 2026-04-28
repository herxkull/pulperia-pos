export function formatStock(stock: number, unitsPerPackage: number, unitName: string, packageName: string) {
  if (unitsPerPackage <= 1) return `${stock} ${unitName}`;
  
  const packages = Math.floor(stock / unitsPerPackage);
  const units = stock % unitsPerPackage;
  
  if (packages === 0) return `${units} ${unitName}`;
  if (units === 0) return `${packages} ${packageName}`;
  
  return `${packages} ${packageName} y ${units} ${unitName}`;
}
