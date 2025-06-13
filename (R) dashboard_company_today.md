SELECT 'New Business'::text AS business_type,
    sum(s.premium) AS premium,
    count(s.policy_id) AS policies
   FROM qq.policies s
     JOIN qq.contacts c ON c.entity_id = s.customer_id
     JOIN qq.locations l ON c.location_id = l.location_id
  WHERE s.business_type::text = 'N'::text AND s.lob_id <> 34 AND s.lob_id <> 40 AND (s.policy_status::text = 'C'::text OR s.policy_status::text = 'A'::text) AND s.binder_date = CURRENT_DATE AND s.premium > '$1.00'::money AND (l.location_type = ANY (ARRAY[1, 2, 4]))
UNION
 SELECT 'Renewal'::text AS business_type,
    sum(s.premium) AS premium,
    count(s.policy_id) AS policies
   FROM qq.policies s
     JOIN qq.contacts c ON c.entity_id = s.customer_id
     JOIN qq.locations l ON c.location_id = l.location_id
  WHERE s.business_type::text = 'R'::text AND s.lob_id <> 34 AND s.lob_id <> 40 AND (s.policy_status::text = 'C'::text OR s.policy_status::text = 'A'::text) AND s.binder_date = CURRENT_DATE AND s.premium > '$1.00'::money AND (l.location_type = ANY (ARRAY[1, 2, 4]))
UNION
 SELECT 'Rewrite'::text AS business_type,
    sum(s.premium) AS premium,
    count(s.policy_id) AS policies
   FROM qq.policies s
     JOIN qq.contacts c ON c.entity_id = s.customer_id
     JOIN qq.locations l ON c.location_id = l.location_id
  WHERE s.business_type::text = 'W'::text AND s.lob_id <> 34 AND s.lob_id <> 40 AND (s.policy_status::text = 'C'::text OR s.policy_status::text = 'A'::text) AND s.binder_date = CURRENT_DATE AND s.premium > '$1.00'::money AND (l.location_type = ANY (ARRAY[1, 2, 4]))
UNION
 SELECT 'Total'::text AS business_type,
    sum(s.premium) AS premium,
    count(s.policy_id) AS policies
   FROM qq.policies s
     JOIN qq.contacts c ON c.entity_id = s.customer_id
     JOIN qq.locations l ON c.location_id = l.location_id
  WHERE s.lob_id <> 34 AND s.lob_id <> 40 AND (s.policy_status::text = 'C'::text OR s.policy_status::text = 'A'::text) AND s.binder_date = CURRENT_DATE AND s.premium > '$1.00'::money AND (l.location_type = ANY (ARRAY[1, 2, 4]));