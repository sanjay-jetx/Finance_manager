import{c as r}from"./index-me20-dpg.js";/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=r("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]),c=new Set(["Lending Recovery","Receivable returned"]);function n(e){return e?e.type==="income"&&e.category&&c.has(e.category)?"receivable_return":e.type:"expense"}function a(e){return e==="income"||e==="receivable_return"}export{i as S,a as i,n as t};
