 SELECT u.display_name AS csr,
    count(p.binder_date) AS policies,
    to_char(sum(p.premium)::numeric, '$FM999,999'::text) AS premium,
    u.entity_id AS id_user,
    l.alias AS location
   FROM qq.policies p
     JOIN qq.contacts u ON p.csr_id = u.entity_id
     JOIN qq.locations l ON l.location_id = u.location_id
  WHERE u.contact_type::text = 'E'::text AND (p.policy_status::text = 'A'::text OR p.policy_status::text = 'C'::text) AND p.binder_date >= (date_trunc('week'::text, now()) - '7 days'::interval) AND p.binder_date < date_trunc('week'::text, now()) AND p.lob_id <> 34 AND p.lob_id <> 40 AND p.business_type::text = 'N'::text
  GROUP BY l.alias, u.entity_id
  ORDER BY (sum(p.premium)) DESC
 LIMIT 3;