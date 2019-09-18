
CREATE TABLE score_submissions (
   id SERIAL PRIMARY KEY,
   submitter VARCHAR(255) NOT NULL,
   shoe_type VARCHAR(255) NOT NULL,
   score SMALLINT NOT NULL,
   created TIMESTAMP DEFAULT now()
);
CREATE INDEX submitter_index
ON score_submissions (submitter);
CREATE INDEX shoe_type_index
ON score_submissions (shoe_type);

CREATE TABLE aggregate_scores (
  shoe_type VARCHAR(255) PRIMARY KEY,
  aggregate_score FLOAT(1) NOT NULL,
  dirty BOOLEAN DEFAULT true  
);


DROP TABLE IF EXISTS score_submissions;
DROP TABLE IF EXISTS aggregate_scores;