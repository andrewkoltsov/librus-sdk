import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";

import { LibrusPortalPageError } from "../models/errors.js";

function isElementNode(
  node: DefaultTreeAdapterTypes.ChildNode,
): node is DefaultTreeAdapterTypes.Element {
  return "tagName" in node && "attrs" in node;
}

function findCsrfToken(
  node: DefaultTreeAdapterTypes.ParentNode,
): string | undefined {
  for (const child of node.childNodes) {
    if (isElementNode(child)) {
      const nameAttr = child.attrs.find(
        (attribute) => attribute.name === "name",
      );
      const valueAttr = child.attrs.find(
        (attribute) => attribute.name === "value",
      );

      if (
        child.tagName === "input" &&
        nameAttr?.value === "_token" &&
        valueAttr?.value
      ) {
        return valueAttr.value;
      }

      const token = findCsrfToken(child);

      if (token) {
        return token;
      }
    }
  }

  return undefined;
}

export function extractPortalCsrfToken(html: string): string {
  const document = parseFragment(html);
  const token = findCsrfToken(document);

  if (!token) {
    throw new LibrusPortalPageError();
  }

  return token;
}
