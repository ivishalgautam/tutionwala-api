export function transformAadhaarData(input) {
  const result = input.result[0];
  const uidData = result.data_json.Certificate.CertificateData.KycRes.UidData;

  return {
    user_dob: uidData.Poi.dob, // "03-02-2003"
    address_zip: uidData.Poa.pc, // "121003"
    user_gender: uidData.Poi.gender, // "M"
    reference_id: input.request_id, // Using request_id as a reference ID
    user_address: {
      po: uidData.Poa.po,
      loc: uidData.Poa.loc,
      vtc: uidData.Poa.vtc,
      dist: uidData.Poa.dist,
      house: uidData.Poa.house,
      state: uidData.Poa.state,
      street: uidData.Poa.street,
      country: uidData.Poa.country,
      subdist: "", // not available in input
      landmark: uidData.Poa.lm || "",
    },
    user_zip_data: "", // not available in input
    user_full_name: uidData.Poi.name,
    user_has_image: false, // not available in input, assuming false
    aadhaar_xml_raw: "", // not available in input
    user_parent_name: uidData.Poa.co,
    aadhaar_share_code: "", // not available in input
    user_profile_image: "", // not available in input
    user_aadhaar_number: uidData.uid, // mask the Aadhaar number
    user_mobile_verified: false, // not available in input
  };
}
