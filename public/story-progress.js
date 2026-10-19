// Clamp skipped scroll frames and restored page positions to a valid chapter.
export function storyChapter(top,height,pinnedHeight,count){
 const travel=height-pinnedHeight;
 if(travel<=0||count<1)return 0;
 const progress=Math.max(0,Math.min(1,-top/travel));
 return Math.min(count-1,Math.floor(progress*count));
}
