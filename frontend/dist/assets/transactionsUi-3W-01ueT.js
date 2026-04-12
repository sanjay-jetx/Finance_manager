import{c as r}from"./index--FROLUAk.js";/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a=r("ArrowDownRight",[["path",{d:"m7 7 10 10",key:"1fmybs"}],["path",{d:"M17 7v10H7",key:"6fjiku"}]]);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=r("ArrowUpRight",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=r("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]),n=new Set(["Lending Recovery","Receivable returned"]),i={Lending:"You lent","You lent (receivable)":"You lent","Lending Recovery":"Receivable received","Receivable returned":"Receivable received"};function s(e){return e==null||e===""||e==="Income"||e==="Expense"?null:i[e]??e}function d(e){return e?e.type==="income"&&e.category&&n.has(e.category)?"receivable_return":e.type:"expense"}function u(e){return e==="income"||e==="receivable_return"}export{c as A,o as U,a,s as d,u as i,d as t};
