import React from "react"
import styles from "./Leaderboard.module.css"
import { exec } from "child_process"

function mean(array: Array<number>) {
  return array.reduce((a, b) => a + b, 0) / array.length
}

function formatNumber(number: number) {
  return Number(number.toFixed(1))
}

/**
 * ```python
 * def _get_pass_at_1(model):
 *     results = results_df[results_df["model"] == model]
 *     # date filter
 *     results = results[results["date"] >= start]
 *     results = results[results["date"] <= end]
 *     average_pass = results["pass@1"].mean()
 *     easy_pass = results[results["difficulty"] == "easy"]["pass@1"].mean()
 *     medium_pass = results[results["difficulty"] == "medium"]["pass@1"].mean()
 *     hard_pass = results[results["difficulty"] == "hard"]["pass@1"].mean()
 *     atcoder_pass = results[results["platform"] == "atcoder"]["pass@1"].mean()
 *     codeforces_pass = results[results["platform"] == "codeforces"]["pass@1"].mean()
 *     leetcode_pass = results[results["platform"] == "leetcode"]["pass@1"].mean()
 *     # print(results['platform'].value_counts())
 *     hard_results = results[results["difficulty"] == "hard"]
 *     print(model, "-->", hard_results[(hard_results["pass@1"] > 0)].question_id.tolist())
 *     return (
 *         average_pass,
 *         easy_pass,
 *         medium_pass,
 *         hard_pass,
 *         atcoder_pass,
 *         leetcode_pass,
 *         codeforces_pass,
 *     )
 * ```
 */
function get_pass_at_1(
  results_df: Array<any>,
  model: string,
  start: number,
  end: number
) {
  // model and date filter
  const results = results_df.filter(
    (result) =>
      result["model"] === model &&
      result["date"] >= start &&
      result["date"] <= end
  )

  const average_pass = formatNumber(
    mean(results.map((result) => result["pass@1"]))
  )
  const easy_pass = formatNumber(
    mean(
      results
        .filter((result) => result["difficulty"] === "easy")
        .map((result) => result["pass@1"])
    )
  )
  const medium_pass = formatNumber(
    mean(
      results
        .filter((result) => result["difficulty"] === "medium")
        .map((result) => result["pass@1"])
    )
  )
  const hard_pass = formatNumber(
    mean(
      results
        .filter((result) => result["difficulty"] === "hard")
        .map((result) => result["pass@1"])
    )
  )

  const exec_pass = formatNumber(
    mean(results.map((result) => result["Pass@1"]))
  )

  const cot_pass = formatNumber(
    mean(results.map((result) => result["Pass@1-COT"]))
  )

  // console.log("COT PASS: ", cot_pass, cot_pass != undefined, cot_pass != null, cot_pass.toString() != "NaN")

  return {
    average_pass,
    easy_pass,
    medium_pass,
    hard_pass,
    exec_pass,
    cot_pass,
  }
}

/**
 *
 * ```python
 * pd.DataFrame(
 *     {
 *         model: {
 *             "Model": model.model_repr,
 *             "Release Date": model.release_date.date(),
 *             "Contaminated": model.release_date > start,
 *             "Pass@1": _get_pass_at_1(model.model_repr)[0],
 *             "Easy-Pass@1": _get_pass_at_1(model.model_repr)[1],
 *             "Medium-Pass@1": _get_pass_at_1(model.model_repr)[2],
 *             "Hard-Pass@1": _get_pass_at_1(model.model_repr)[3],
 *             # "AtCoder-Pass@1": _get_pass_at_1(
 *             #     model.model_repr
 *             # )[4],
 *             # "LeetCode-Pass@1": _get_pass_at_1(
 *             #     model.model_repr
 *             # )[5],
 *             # "CodeForces-Pass@1": _get_pass_at_1(
 *             #     model.model_repr
 *             # )[6],
 *             # "Naive Test Cases Correctness": _get_naive_test_cases_correctness(
 *             #     model, questions_filtered
 *             # ),
 *         }
 *         for model in results_df.model_class.unique()
 *     }
 * )
 * ```
 */
function getLeaderboard(
  performances: Array<any>,
  models: Array<any>,
  start: number,
  end: number
) {
  return models
    .filter((model) => model.release_date)
    .map((model) => {
      const { average_pass, easy_pass, medium_pass, hard_pass, exec_pass, cot_pass } = get_pass_at_1(
        performances,
        model.model_repr,
        start,
        end
      )
      if (performances[0].hasOwnProperty("Pass@1-COT")) {
        let output = {
          Model: model.model_repr,
          "Estimated Cutoff For LiveCodeBench":
            "Estimated Cutoff For LiveCodeBench: " + new Date(model.release_date).toLocaleDateString(),
          Contaminated: model.release_date >= start,
          "Pass@1": cot_pass.toString() === "NaN" ? -1 : cot_pass,
          "Pass@1 (no COT)": exec_pass.toString() === "NaN" ? -1 : exec_pass,
        }
        return output
      }
      else {
        let output = {
          Model: model.model_repr,
          "Estimated Cutoff For LiveCodeBench":
            "Estimated Cutoff For LiveCodeBench: " + new Date(model.release_date).toLocaleDateString(),
          Contaminated: model.release_date >= start,
          "Pass@1": average_pass.toString() === "NaN" ? -1 : average_pass,
          "Easy-Pass@1": easy_pass.toString() === "NaN" ? -1 : easy_pass,
          "Medium-Pass@1": medium_pass.toString() === "NaN" ? -1 : medium_pass,
          "Hard-Pass@1": hard_pass.toString() === "NaN" ? -1 : hard_pass,
        }
        return output
      }
    })
    .sort((a, b) => b["Pass@1"] - a["Pass@1"])
    .reduce(
      (
        acc: {
          results: Array<typeof model & { Rank: number | null }>
          rank: number
        },
        model
      ) => {
        let rank = null
        if (!model.Contaminated) {
          rank = acc.rank
          acc.rank += 1
        }
        acc.results.push({
          Rank: rank,
          ...model,
        })
        return acc
      },
      { results: [], rank: 1 }
    ).results
}

function getDateMarksFromModels(models: Array<any>) {
  const modelDates = models
    .filter((model) => model.release_date)
    .map((model) => model.release_date)

  const uniqueDates = [
    // @ts-ignore
    ...new Set(modelDates),
    new Date("2024-01-01").getTime(),
  ]

  return uniqueDates
    .map((date) => ({
      value: date,
      label: new Date(date).toLocaleDateString(undefined, {
        timeZone: "UTC",
      }),
    }))
    .sort((a, b) => a.value - b.value)
}

function getDateMarksFromTimestamps(timestamps: Array<number>) {
  return timestamps.map((timestamp) => ({
    value: timestamp,
    // Convert seconds to milliseconds if needed (timestamp < 10000000000)
    label: new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp).toLocaleDateString(undefined, {
      timeZone: "UTC",
    }),
  }))
}

function getColumnDefs(columnNames: Array<string>, modelsDict: any) {
  // Format the columns into array of { field: "column_name" }
  return columnNames
    .map((column_name) => {
      switch (column_name) {
        case "Rank":
          return {
            field: column_name,
            suppressMovable: true,
            cellClass: 'suppress-movable-col',
          }

        case "Model":
          return {
            field: column_name,
            suppressMovable: true,
            cellClass: 'suppress-movable-col',
            flex: 2,
            tooltipField: "Estimated Cutoff For LiveCodeBench",
            cellRenderer: (params: any) => {
              return modelsDict[params.value].link ? (
                <a
                  href={modelsDict[params.value].link}
                  target="_blank"
                  className={styles.leaderboardModelLink}
                >
                  {params.value}
                </a>
              ) : (
                params.value
              )
            },
          }

        case "Estimated Cutoff For LiveCodeBench":
          return null

        case "Contaminated":
          return null
          return {
            field: column_name,
            headerTooltip: `
              Model is considered contaminated if it is released after the start date of
              the selected problems set.
            `,
          }

        case "Pass@1":
          return {
            field: column_name,
            headerTooltip: `
              Pass@1 is probability of passing a given problem in one attempt.
            `,
            sort: "desc",
          }
        case "Pass@1-COT":
          return {
            field: column_name,
            headerTooltip: `
                Pass@1 is probability of passing a given problem in one attempt with CoT.
              `,
            sort: "desc",
          }

        case "Pass@1 (no COT)":
          return {
            field: column_name,
            headerTooltip: `
                  Pass@1 is probability of passing a given problem in one attempt without CoT.
                `,
            sort: "desc",
          }

        case "Easy-Pass@1":
          return {
            field: column_name,
            headerTooltip: "Pass@1 on problems with Easy difficulty",
          }

        case "Medium-Pass@1":
          return {
            field: column_name,
            headerTooltip: "Pass@1 on problems with Medium difficulty",
          }

        case "Hard-Pass@1":
          return {
            field: column_name,
            headerTooltip: "Pass@1 on problems with Hard difficulty",
          }

        default:
          return {
            field: column_name,
          }
      }
    })
    .filter((columnDef) => columnDef !== null)
}

/**
 * Compute winrates between models and calculate ELO rankings.
 * 
 * @param performances Array of performance results
 * @param models Array of model objects
 * @param start Start timestamp for filtering
 * @param end End timestamp for filtering
 * @param K ELO K-factor (default 32)
 * @returns Object with winrate data and ELO rankings
 */
function computeWinratesAndElo(
  performances: Array<any>,
  models: Array<any>,
  start: number,
  end: number,
  K: number = 32
) {
  // Filter by date range
  const filteredPerformances = performances.filter(
    (perf) => perf.timestamp >= start && perf.timestamp < end
  )
  
  // Filter by models if specified
  const modelNames = models.map(m => m.model_repr)
  const filteredByModel = filteredPerformances.filter(
    (perf) => modelNames.includes(perf.model)
  )
  // Get unique models after filtering
  const uniqueModels = Array.from(new Set(filteredByModel.map(perf => perf.model)))

  // Initialize winrate tracking
  const wins: Record<string, Record<string, number>> = {}
  const matches: Record<string, Record<string, number>> = {}
  
  uniqueModels.forEach(model => {
    wins[model] = {}
    matches[model] = {}
    uniqueModels.forEach(opponent => {
      if (opponent !== model) {
        wins[model][opponent] = 0
        matches[model][opponent] = 0
      }
    })
  })
  
  // Group by post_id to compare models on same posts
  const postGroups: Record<string, Array<any>> = {}
  filteredByModel.forEach(perf => {
    if (!postGroups[perf.id]) {
      postGroups[perf.id] = []
    }
    postGroups[perf.id].push(perf)
  })
  
  // Compare each pair of models
  Object.values(postGroups).forEach(group => {
    // Only consider posts with multiple models
    if (group.length < 2) return
    
    for (let i = 0; i < group.length; i++) {
      const modelA = group[i].model
      const rewardA = group[i].reward
      
      for (let j = i + 1; j < group.length; j++) {
        const modelB = group[j].model
        const rewardB = group[j].reward
        
        matches[modelA][modelB] += 1
        matches[modelB][modelA] += 1
        
        if (rewardA > rewardB) {
          wins[modelA][modelB] += 1
        } else if (rewardB > rewardA) {
          wins[modelB][modelA] += 1
        } else { // Tie
          wins[modelA][modelB] += 0.5
          wins[modelB][modelA] += 0.5
        }
      }
    }
  })
  
  // Calculate winrates
  const winrateData: Array<{
    model: string,
    opponent: string,
    winrate: number,
    matches: number
  }> = []
  
  uniqueModels.forEach(model => {
    uniqueModels.forEach(opponent => {
      if (model !== opponent && matches[model][opponent] > 0) {
        winrateData.push({
          model,
          opponent,
          winrate: formatNumber(wins[model][opponent] / matches[model][opponent]),
          matches: matches[model][opponent]
        })
      }
    })
  })
  
  // Calculate ELO ratings
  const eloRankings = calculateElo(filteredByModel, K, ["Politics", "Entertainment"])
  
  return { winrateData, eloRankings }
}

/**
 * Calculate ELO ratings for models based on pairwise comparisons.
 * 
 * @param performances Array of performance results
 * @param K ELO K-factor
 * @returns Array with model ELO ratings
 */
function calculateElo(performances: Array<any>, K: number = 32, topics: Array<string> = []) {
  // Initialize all models with 1000 ELO
  const uniqueModels = Array.from(new Set(performances.map(perf => perf.model)))
  const elo: Record<string, number> = {}
  const matchesPlayed: Record<string, number> = {}
  const topicElo: Record<string, Record<string, number>> = {}
  const topicMatchesPlayed: Record<string, Record<string, number>> = {}

  topics.forEach(topic => {
    topicElo[topic] = {}
    topicMatchesPlayed[topic] = {}
    
    uniqueModels.forEach(model => {
      topicElo[topic][model] = 1000
      topicMatchesPlayed[topic][model] = 0
    })
  })

  uniqueModels.forEach(model => {
    elo[model] = 1000
    matchesPlayed[model] = 0
  })
  
  // Group by post_id to compare models on same posts
  const postGroups: Record<string, Array<any>> = {}
  performances.forEach(perf => {
    if (!postGroups[perf.id]) {
      postGroups[perf.id] = []
    }
    postGroups[perf.id].push(perf)
  })
  
  // Filter to only posts with multiple models and sort in a deterministic random order
  const seed = 42; // Fixed seed for reproducibility
  const randomGenerator = seededRandom(seed);
  
  const validPostGroups = Object.entries(postGroups)
    .filter(([_, group]) => group.length >= 2)
    .sort(() => randomGenerator() - 0.5) // Random but deterministic order
  
  // Process matches chronologically
  validPostGroups.forEach(([_, group]) => {
    // Get the topic of this post if available
    const postTopic = group[0].topic || null;
    
    for (let i = 0; i < group.length; i++) {
      const modelA = group[i].model
      const rewardA = group[i].reward
      
      for (let j = i + 1; j < group.length; j++) {
        const modelB = group[j].model
        const rewardB = group[j].reward
        
        // Update match count for overall ELO
        matchesPlayed[modelA] += 1
        matchesPlayed[modelB] += 1
        
        // Calculate expected scores for overall ELO
        const expectedA = 1 / (1 + Math.pow(10, (elo[modelB] - elo[modelA]) / 400))
        const expectedB = 1 - expectedA
        
        // Determine actual scores
        let scoreA, scoreB
        if (rewardA > rewardB) {
          scoreA = 1
          scoreB = 0
        } else if (rewardB > rewardA) {
          scoreA = 0
          scoreB = 1
        } else {
          scoreA = 0.5
          scoreB = 0.5
        }
        
        // Update overall ELO ratings
        elo[modelA] += K * (scoreA - expectedA)
        elo[modelB] += K * (scoreB - expectedB)
        
        // Update topic-specific ELO if this post has a topic and it's in our topics list
        if (postTopic && topics.includes(postTopic)) {
          // Update topic match count
          topicMatchesPlayed[postTopic][modelA] += 1
          topicMatchesPlayed[postTopic][modelB] += 1
          
          // Calculate expected scores for topic ELO
          const topicExpectedA = 1 / (1 + Math.pow(10, (topicElo[postTopic][modelB] - topicElo[postTopic][modelA]) / 400))
          const topicExpectedB = 1 - topicExpectedA
          
          // Update topic ELO ratings
          topicElo[postTopic][modelA] += K * (scoreA - topicExpectedA)
          topicElo[postTopic][modelB] += K * (scoreB - topicExpectedB)
        }
      }
    }
  })
  
  // Create array with results including topic-specific ELOs
  const eloData = uniqueModels.map(model => {
    const result: any = {
      model,
      elo: formatNumber(elo[model]),
      matches: matchesPlayed[model]
    }
    
    // Add topic-specific ELOs
    topics.forEach(topic => {
      if (topicMatchesPlayed[topic][model] > 0) {
        result[`elo_${topic}`] = formatNumber(topicElo[topic][model])
        result[`matches_${topic}`] = topicMatchesPlayed[topic][model]
      } else {
        result[`elo_${topic}`] = null
        result[`matches_${topic}`] = 0
      }
    })
    
    return result
  })
  
  // Sort by ELO descending
  return eloData.sort((a, b) => b.elo - a.elo)
}

/**
 * Simple seeded random number generator
 */
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Get ELO leaderboard data
 */
function getEloLeaderboard(
  performances: Array<any>,
  models: Array<any>,
  start: number,
  end: number,
  K: number = 32
) {
  console.log("performances", performances)
  const { winrateData, eloRankings } = computeWinratesAndElo(performances, models, start, end, K)
  console.log("winrateData", winrateData)

  console.log("eloRankings", eloRankings)
  return eloRankings
    .map(ranking => {
      const modelObj = models.find(m => m.model_repr === ranking.model)
      
      return {
        Model: ranking.model,
        // "Estimated Cutoff For PersuasionIndex": 
        //   "Estimated Cutoff For PersuasionIndex: " + 
        //   (modelObj?.release_date ? new Date(modelObj.release_date).toLocaleDateString() : "Unknown"),
        Contaminated: modelObj?.release_date >= start,
        "ELO": ranking.elo,
        // "Matches": ranking.matches,
        "Politics": ranking.elo_Politics,
        "Entertainment": ranking.elo_Entertainment
      }
    })
    .reduce(
      (
        acc: {
          results: Array<any>
          rank: number
        },
        model
      ) => {
        let rank = null
        if (!model.Contaminated) {
          rank = acc.rank
          acc.rank += 1
        }
        acc.results.push({
          Rank: rank,
          ...model,
        })
        return acc
      },
      { results: [], rank: 1 }
    ).results
}

export { 
  getDateMarksFromTimestamps, 
  getLeaderboard, 
  getColumnDefs,
  getEloLeaderboard,
  computeWinratesAndElo
}
