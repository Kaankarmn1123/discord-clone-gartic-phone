ALTER TABLE public.game_session_players
ADD CONSTRAINT game_session_players_session_id_user_id_key UNIQUE (session_id, user_id);

ALTER TABLE public.game_rounds
ADD CONSTRAINT game_rounds_session_id_round_number_chain_starter_id_key UNIQUE (session_id, round_number, chain_starter_id);