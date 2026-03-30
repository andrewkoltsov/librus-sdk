import { describe, expect, expectTypeOf, it } from "vitest";

import type { AttendancesResponse as CompatibilityAttendancesResponse } from "../src/sdk/models/synergia.js";
import type { GradesResponse as CompatibilityGradesResponse } from "../src/sdk/models/synergia.js";
import type { HomeWorksResponse as CompatibilityHomeWorksResponse } from "../src/sdk/models/synergia.js";
import type { SynergiaMeResponse as CompatibilitySynergiaMeResponse } from "../src/sdk/models/synergia.js";
import type { AttendancesResponse as SplitAttendancesResponse } from "../src/sdk/models/synergia/attendance.js";
import type { GradesResponse as SplitGradesResponse } from "../src/sdk/models/synergia/grades.js";
import type { HomeWorksResponse as SplitHomeWorksResponse } from "../src/sdk/models/synergia/homework.js";
import type { SynergiaMeResponse as SplitSynergiaMeResponse } from "../src/sdk/models/synergia/me.js";
import {
  attendancesResponseSchema,
  gradesResponseSchema,
  homeWorksResponseSchema,
  portalMeSchema,
  synergiaAccountsResponseSchema,
  synergiaMeResponseSchema,
} from "../src/sdk/validation/schemas.js";
import { attendancesResponseSchema as splitAttendancesResponseSchema } from "../src/sdk/validation/synergia/attendance.js";
import { gradesResponseSchema as splitGradesResponseSchema } from "../src/sdk/validation/synergia/grades.js";
import { homeWorksResponseSchema as splitHomeWorksResponseSchema } from "../src/sdk/validation/synergia/homework.js";
import { synergiaMeResponseSchema as splitSynergiaMeResponseSchema } from "../src/sdk/validation/synergia/me.js";
import {
  portalMeSchema as splitPortalMeSchema,
  synergiaAccountsResponseSchema as splitSynergiaAccountsResponseSchema,
} from "../src/sdk/validation/portal.js";

describe("foundation refactor compatibility barrels", () => {
  it("re-exports split validation schemas through the compatibility barrel", () => {
    expect(portalMeSchema).toBe(splitPortalMeSchema);
    expect(synergiaAccountsResponseSchema).toBe(
      splitSynergiaAccountsResponseSchema,
    );
    expect(synergiaMeResponseSchema).toBe(splitSynergiaMeResponseSchema);
    expect(gradesResponseSchema).toBe(splitGradesResponseSchema);
    expect(attendancesResponseSchema).toBe(splitAttendancesResponseSchema);
    expect(homeWorksResponseSchema).toBe(splitHomeWorksResponseSchema);
  });

  it("re-exports split Synergia model types through the compatibility barrel", () => {
    expectTypeOf<CompatibilitySynergiaMeResponse>().toEqualTypeOf<SplitSynergiaMeResponse>();
    expectTypeOf<CompatibilityGradesResponse>().toEqualTypeOf<SplitGradesResponse>();
    expectTypeOf<CompatibilityAttendancesResponse>().toEqualTypeOf<SplitAttendancesResponse>();
    expectTypeOf<CompatibilityHomeWorksResponse>().toEqualTypeOf<SplitHomeWorksResponse>();
  });
});
