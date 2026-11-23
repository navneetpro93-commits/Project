package finguard.savings;

import java.util.ArrayList;
import java.util.Collections;

import finguard.model.SavingsChallenge;

public class ChallengeBoard {
    private ArrayList<SavingsChallenge> challenges;

    public ChallengeBoard() {
        this.challenges = new ArrayList<SavingsChallenge>();
    }

    public void add(SavingsChallenge challenge) {
        challenges.add(challenge);
    }

    public SavingsChallenge find(String accountNumber) {
        for (int i = 0; i < challenges.size(); i++) {
            if (challenges.get(i).getAccountNumber().equals(accountNumber)) {
                return challenges.get(i);
            }
        }
        return null;
    }

    public ArrayList<SavingsChallenge> ranked() {
        ArrayList<SavingsChallenge> copy = new ArrayList<SavingsChallenge>();
        for (int i = 0; i < challenges.size(); i++) {
            copy.add(challenges.get(i));
        }
        Collections.sort(copy);
        return copy;
    }

    public void printLeaderboard() {
        ArrayList<SavingsChallenge> copy = ranked();
        System.out.println("----- Savings challenge leaderboard -----");
        for (int i = 0; i < copy.size(); i++) {
            System.out.println("  " + (i + 1) + ". " + copy.get(i).report());
        }
    }
}
