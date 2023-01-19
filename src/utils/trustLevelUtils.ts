import { AppStrings } from "./appStrings";
import { TrustLevel } from "./enum";

export function myTrustLevel(userImage: number, userIdNumber: number, threeXRef: number, homeAddress: number): number {
  return userImage * 1000 + userIdNumber * 100 + threeXRef * 10 + homeAddress;
}

/*export function trustLevelMessage(level:number) {
   return levelMessage[level]
}*/
   

/*
export function trustLevelStars(level: number, type:number = 1) {
  if(type ===1)return status[level];

  switch (status[level]) {
    case TrustLevel.NOT_TRUSTED:
      return AppStrings.NOT_TRUSTED;
    case TrustLevel.AVERAGE_TRUST:
      return AppStrings.AVG_TRUSTED;
    case TrustLevel.NOT_VERIFIED:
      return AppStrings.NOT_VERIFIED;
    case TrustLevel.ABOVE_AVERAGE_TRUST:
      return AppStrings.ABOVE_AVERAGE_TRUST
    case TrustLevel.ALMOST_TRUST:
      return AppStrings.ALMOST_TRUST
    case TrustLevel.SUPER_TRUSTED:
      return AppStrings.SUPER_TRUSTED
    default:
      break;
  }
}
*/

/*
let status: { [key: number]: TrustLevel } = {
  // Valid(3) vs Invalid(2)
  2222: TrustLevel.NOT_TRUSTED,
  3222: TrustLevel.NOT_TRUSTED,
  2322: TrustLevel.NOT_TRUSTED,
  3322: TrustLevel.AVERAGE_TRUST,
  2232: TrustLevel.NOT_TRUSTED,
  3232: TrustLevel.NOT_TRUSTED,
  2332: TrustLevel.NOT_TRUSTED,
  3332: TrustLevel.AVERAGE_TRUST,
  2223: TrustLevel.NOT_TRUSTED,
  3223: TrustLevel.NOT_TRUSTED,
  2323: TrustLevel.NOT_TRUSTED,
  3323: TrustLevel.ABOVE_AVERAGE_TRUST,
  2233: TrustLevel.NOT_TRUSTED,
  3233: TrustLevel.NOT_TRUSTED,
  2333: TrustLevel.NOT_TRUSTED,
  3333: TrustLevel.SUPER_TRUSTED,

  // Pending(1) vs Valid(3)
  1111: TrustLevel.NOT_VERIFIED,
  3111: TrustLevel.ALMOST_TRUST,
  1311: TrustLevel.ALMOST_TRUST,
  3311: TrustLevel.AVERAGE_TRUST,
  1131: TrustLevel.ALMOST_TRUST,
  3131: TrustLevel.ALMOST_TRUST,
  1331: TrustLevel.ALMOST_TRUST,
  3331: TrustLevel.ABOVE_AVERAGE_TRUST,
  1113: TrustLevel.ALMOST_TRUST,
  3113: TrustLevel.ABOVE_AVERAGE_TRUST,
  1313: TrustLevel.ABOVE_AVERAGE_TRUST,
  3313: TrustLevel.ABOVE_AVERAGE_TRUST,
  1133: TrustLevel.ABOVE_AVERAGE_TRUST,
  3133: TrustLevel.ABOVE_AVERAGE_TRUST,
  1333: TrustLevel.ABOVE_AVERAGE_TRUST,

  // Invalid(2) vs Pending/Not Submitted(1)
  2111: TrustLevel.NOT_VERIFIED,
  1211: TrustLevel.NOT_VERIFIED,
  2211: TrustLevel.NOT_TRUSTED,
  1121: TrustLevel.NOT_VERIFIED,
  2121: TrustLevel.NOT_TRUSTED,
  1221: TrustLevel.NOT_TRUSTED,
  2221: TrustLevel.NOT_TRUSTED,
  1112: TrustLevel.ALMOST_TRUST,
  2112: TrustLevel.NOT_TRUSTED,
  1212: TrustLevel.NOT_TRUSTED,
  2212: TrustLevel.NOT_TRUSTED,
  1122: TrustLevel.NOT_TRUSTED,
  2122: TrustLevel.NOT_TRUSTED,
  1222: TrustLevel.NOT_TRUSTED,

  // EXTRA COMBINATIONS - Pending(1) vs Invalid(2) vs Accepted(3)
  1132: TrustLevel.ALMOST_TRUST,
  1213: TrustLevel.ALMOST_TRUST,
  1223: TrustLevel.ALMOST_TRUST,
  1231: TrustLevel.ALMOST_TRUST,
  1232: TrustLevel.NOT_TRUSTED,
  1233: TrustLevel.ALMOST_TRUST,
  1312: TrustLevel.ALMOST_TRUST,
  1321: TrustLevel.ALMOST_TRUST,
  1323: TrustLevel.AVERAGE_TRUST,
  1332: TrustLevel.AVERAGE_TRUST,
  3112: TrustLevel.ALMOST_TRUST,
  3121: TrustLevel.ALMOST_TRUST,
  3123: TrustLevel.AVERAGE_TRUST,
  3132: TrustLevel.ALMOST_TRUST,
  3211: TrustLevel.ALMOST_TRUST,
  3212: TrustLevel.NOT_TRUSTED,
  3213: TrustLevel.ALMOST_TRUST,
  3221: TrustLevel.NOT_TRUSTED,
  3231: TrustLevel.ALMOST_TRUST,
  3312: TrustLevel.AVERAGE_TRUST,
  3321: TrustLevel.AVERAGE_TRUST,
  2113: TrustLevel.ALMOST_TRUST,
  2123: TrustLevel.NOT_TRUSTED,
  2131: TrustLevel.ALMOST_TRUST,
  2132: TrustLevel.NOT_TRUSTED,
  2133: TrustLevel.AVERAGE_TRUST,
  2213: TrustLevel.NOT_TRUSTED,
  2231: TrustLevel.NOT_TRUSTED,
};
let levelMessage: { [key: number]: string } = {
  // Valid(3) vs Invalid(2)
  2222:" More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  3222:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  2322:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  3322:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  2232:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  3232:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  2332:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  3332:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  2223:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  3223:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  2323:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  3323:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  2233:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  3233:"Your ID number is invalid. Try revalidating/uploading your ID. Contact us if you are experiencing difficulty",
  2333:"Your ID number is invalid. Try revalidating/uploading your ID. Contact us if you are experiencing difficulty",
  3333:" TrustLevel.SUPER_TRUSTED",

  // Pending(1) vs Valid(3)
  1111:"To obtain a trust level upload your ID, Pic, References or share your Address/Location. Contact us if you are experiencing difficulty",
  3111:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1311:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3311:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1131:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3131:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1331:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3331:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1113:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3113:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1313:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3313:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1133:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3133:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1333:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",

  // Invalid(2) vs Pending/Not Submitted(1)
  2111:"To obtain a trust level upload your ID, Pic, References or share your Address/Location. Contact us if you are experiencing difficulty",
  1211:"To obtain a trust level upload your ID, Pic, References or share your Address/Location. Contact us if you are experiencing difficulty",
  2211:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty  ",
  1121:" To obtain a trust level upload your ID, Pic, References or share your Address/Location. Contact us if you are experiencing difficulty",
  2121:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  1221:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  2221:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  1112:"Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  2112:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  1212:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  2212:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  1122:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  2122:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  1222:"More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",

  // EXTRA COMBINATIONS - Pending(1) vs Invalid(2) vs Accepted(3)
  1132: "Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1213:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1223:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1231:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1232:" More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  1233:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1312:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1321:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1323:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  1332:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3112:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3121:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3123:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3132:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3211:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3212:" More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  3213:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3221:" More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  3231:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3312:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  3321:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  2113:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  2123:" More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  2131:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  2132:" More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  2133:" Update your ID, Pic, References or Address/Location sharing to improve your trust level. Contact us if you are experiencing difficulty",
  2213:" More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
  2231:" More than 1 of your trust criteria are invalid. Try revalidating/uploading your ID, Pic, References or Address/Location. Contact us if you are experiencing difficulty",
};
*/

// console.log(calculateTrust(1311,2));

