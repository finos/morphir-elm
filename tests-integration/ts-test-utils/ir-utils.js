/*
 * Useful traversal utilities for the IR.json
 */
/**
 * converts a module qualified name to a title cased string sperated by a dot `.`
 * @param {Array<string[]>} moduleQualifiedName - the module's qualified name as a list of list of string.
 */
function capitalize(str) {
    return str[0].toUpperCase() + str.substring(1);
}
function toModuleNameString(moduleQualifiedName) {
    return moduleQualifiedName.map(name => name.map(capitalize).join('')).join('.');
}
function toTitleCaseString(name) {
    return name.map(capitalize).join('');
}
function toCamelCaseString(name) {
    return name.map((word, idx) => (idx == 0 ? word : capitalize(word))).join('');
}
/**
 * Get the list of all modules in the json
 * it throws an error if the module ir is null or undefined
 * @param {object} ir IR jsonObject
 */
export function getModules(ir) {
    var _a;
    if (!ir || !ir.distribution)
        throw Error('invalid IR');
    return (_a = ir === null || ir === void 0 ? void 0 : ir.distribution[3]) === null || _a === void 0 ? void 0 : _a.modules;
}
export function findModuleByName(moduleName, ir) {
    return getModules(ir).find(module => toModuleNameString(module[0]) == moduleName);
}
export function findValueByName(module, valueName) {
    return module === null || module === void 0 ? void 0 : module[1].value.values.find(value => toCamelCaseString(value[0]) === valueName);
}
export function findTypeByName(module, typeName) {
    return module === null || module === void 0 ? void 0 : module[1].value.types.find(tpe => toTitleCaseString(tpe[0]) === typeName);
}
export function getModuleTypesFromIR(moduleName, ir) {
    return findModuleByName(moduleName, ir)[1].value.types;
}
export function getTypesFromModule(mod) {
    return mod[1].value.types;
}
export function getModuleValuesFromIR(moduleName, ir) {
    return findModuleByName(moduleName, ir)[1].value.values;
}
export function getValuesFromModule(mod) {
    return mod[1].value.values;
}
export function moduleHasType(mod, typeName) {
    return mod[1].value.types.some(typ => toTitleCaseString(typ[0]) == typeName);
}
export function moduleHasValue(mod, valueName) {
    return mod[1].value.values.some(val => toCamelCaseString(val[0]) == valueName);
}
export function getModuleAccess(mod) {
    if (!mod || mod.length < 2)
        return undefined;
    return mod[1].access;
}
export function getValueAccess(mod, valueName) {
    var _a, _b;
    if (!mod || mod.length < 2)
        return undefined;
    return (_b = (_a = findValueByName(mod, valueName)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.access;
}
export function getValueDoc(value) {
    return value[1].value.doc;
}
export function getTypeDoc(tpe) {
    return tpe[1].value.doc;
}
